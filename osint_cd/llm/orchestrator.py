from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from osint_cd.llm.repository_discovery import build_repository_queries, normalize_repository_results
from osint_cd.llm.schemas import LLMTaskPacket, new_packet
from osint_cd.llm.skills import match_skills


@dataclass(slots=True)
class OrchestratorConfig:
    skills_path: str | None = None
    max_github_queries: int = 6
    max_skills: int = 8


class LLMOrchestrator:
    """Planner simple para uso por IA/LLM."""

    def __init__(self, config: OrchestratorConfig | None = None) -> None:
        self.config = config or OrchestratorConfig()

    def plan(self, request: str, github_results: list[dict] | None = None) -> LLMTaskPacket:
        intent = infer_intent(request)
        queries = build_repository_queries(request, max_queries=self.config.max_github_queries)
        skills = match_skills(request, skills_path=self.config.skills_path, limit=self.config.max_skills)
        findings = normalize_repository_results(github_results or [])
        return new_packet(
            request=request,
            run_id=str(uuid4()),
            intent=intent,
            github_queries=queries,
            skill_matches=skills,
            github_findings=findings,
            recommended_pipeline=recommend_pipeline(intent, bool(findings)),
            next_actions=recommend_next_actions(bool(findings)),
            notes=["Paquete preparado para que la IA consulte repositorios, active skills y analice resultados."],
        )


def infer_intent(request: str) -> str:
    text = request.lower()
    if any(w in text for w in ["github", "repo", "repositorio", "clonar", "integrar"]):
        return "repository_integration"
    if any(w in text for w in ["scraping", "crawler", "selenium", "playwright"]):
        return "collector_analysis"
    if any(w in text for w in ["dashboard", "grafico", "mapa", "html"]):
        return "dashboard_report"
    if any(w in text for w in ["candidato", "eleccion", "municipio", "campaña"]):
        return "political_osint"
    return "general_osint"


def recommend_pipeline(intent: str, has_findings: bool) -> list[str]:
    steps = ["intake", "skill_match", "repository_query_plan"]
    if has_findings:
        steps.extend(["rank_results", "read_key_files", "integration_decision", "analysis_packet"])
    else:
        steps.extend(["search_repositories", "load_results", "rerun_packet"])
    if intent in {"dashboard_report", "political_osint"}:
        steps.append("report_output")
    return steps


def recommend_next_actions(has_findings: bool) -> list[str]:
    if not has_findings:
        return [
            "Usar github_queries para buscar repositorios.",
            "Cargar resultados crudos en github_results.",
            "Volver a generar el packet para ranking y analisis.",
        ]
    return [
        "Rankear resultados por utilidad, licencia y mantenimiento.",
        "Leer README y archivos principales del top 3.",
        "Definir adapter, dependencia externa o vendor local.",
    ]
