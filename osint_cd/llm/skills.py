from __future__ import annotations

import json
from pathlib import Path

from osint_cd.llm.schemas import SkillMatch


DEFAULT_SKILLS: list[dict] = [
    {
        "name": "DIAGONALES INTELLIGENCE",
        "category": "orchestrator",
        "keywords": ["osint", "socmint", "politica", "territorio", "campaña", "redes", "github", "analisis"],
        "activation_hint": "Agente maestro: decide fuentes, módulos, riesgos, salida y narrativa.",
        "priority": 10,
    },
    {
        "name": "LA_PODEROSA",
        "category": "osint-core",
        "keywords": ["scraping", "fuentes", "medios", "portales", "boletines", "sociedades", "licitaciones"],
        "activation_hint": "Discovery OSINT, scraping público, normalización y trazabilidad.",
        "priority": 9,
    },
    {
        "name": "Rastreo RP",
        "category": "media-discovery",
        "keywords": ["medios", "portal", "radio", "municipio", "local", "provincial", "noticias"],
        "activation_hint": "Buscar medios locales/provinciales, URLs, narrativa y actores territoriales.",
        "priority": 8,
    },
    {
        "name": "OSINT Politico Argentina",
        "category": "public-records",
        "keywords": ["argentina", "boletin", "pjn", "csjn", "elecciones", "municipio", "provincia"],
        "activation_hint": "Footprinting, registros públicos argentinos, cadena de custodia y fuentes oficiales.",
        "priority": 8,
    },
    {
        "name": "Detector Bots Redes",
        "category": "socmint-integrity",
        "keywords": ["bots", "astroturfing", "amplificacion", "fake", "seguidores", "redes"],
        "activation_hint": "Scoring 0-100 de comportamiento artificial, coordinación y amplificación.",
        "priority": 7,
    },
    {
        "name": "FLOURISH_OSINT_WORKFLOW_ARGENTINA_v2",
        "category": "visualization",
        "keywords": ["dashboard", "flourish", "csv", "grafico", "mapa", "visualizacion"],
        "activation_hint": "Preparar CSV, visualizaciones, dashboards e informes interactivos.",
        "priority": 6,
    },
    {
        "name": "MiroFish",
        "category": "simulation",
        "keywords": ["simular", "escenario", "agentes", "listas", "candidatos", "probabilidad"],
        "activation_hint": "Simulación de escenarios, listas electorales y dinámica territorial.",
        "priority": 6,
    },
]


def load_skills(path: str | Path | None = None) -> list[dict]:
    if not path:
        return DEFAULT_SKILLS
    p = Path(path)
    if not p.exists():
        return DEFAULT_SKILLS
    loaded = json.loads(p.read_text(encoding="utf-8"))
    if not isinstance(loaded, list):
        raise ValueError("Skills file must contain a JSON list")
    return loaded


def match_skills(request: str, skills_path: str | Path | None = None, limit: int = 8) -> list[SkillMatch]:
    text = request.lower()
    matches: list[tuple[int, SkillMatch]] = []
    for item in load_skills(skills_path):
        keywords = [str(k).lower() for k in item.get("keywords", [])]
        hits = sum(1 for kw in keywords if kw in text)
        base_priority = int(item.get("priority", 5))
        if hits or base_priority >= 9:
            score = hits * 10 + base_priority
            reason = "keywords=" + ",".join([kw for kw in keywords if kw in text]) if hits else "framework base"
            matches.append(
                (
                    score,
                    SkillMatch(
                        name=str(item.get("name")),
                        category=str(item.get("category", "general")),
                        reason=reason,
                        activation_hint=str(item.get("activation_hint", "")),
                        priority=base_priority,
                    ),
                )
            )
    matches.sort(key=lambda x: x[0], reverse=True)
    return [m for _, m in matches[:limit]]
