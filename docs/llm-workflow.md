# OSINT-CD para IA/LLM

Este módulo convierte un pedido en lenguaje natural en un paquete estructurado para que una IA pueda:

1. Entender la intención del pedido.
2. Activar skills Diagonales relevantes.
3. Proponer consultas para buscar repositorios en GitHub.
4. Recibir resultados crudos de GitHub y normalizarlos.
5. Sugerir pipeline de análisis e integración.

## Comando principal

```bash
osint-cd llm-plan \
  --request "buscar repos OSINT con Selenium y social-analyzer para integrar" \
  --output outputs/llm_packet.json
```

## Salida esperada

```json
[
  {
    "request": "buscar repos OSINT con Selenium...",
    "run_id": "uuid",
    "created_at": "2026-06-15T...Z",
    "intent": "repository_integration",
    "github_queries": ["osint buscar repos", "social analyzer buscar repos"],
    "skill_matches": [],
    "github_findings": [],
    "recommended_pipeline": [],
    "next_actions": [],
    "notes": []
  }
]
```

## Ciclo de uso con ChatGPT u otra IA

### Paso 1: generar plan

```bash
osint-cd llm-plan \
  --request "necesito un motor OSINT/SOCMINT con GitHub, Brave, Selenium y export JSON" \
  --output outputs/plan.json
```

### Paso 2: la IA busca en GitHub

La IA toma `github_queries` y busca repositorios con su conector GitHub o API disponible.

### Paso 3: reinyectar resultados

Guardar resultados crudos como JSON, por ejemplo:

```text
outputs/github_results.json
```

Luego:

```bash
osint-cd llm-plan \
  --request "necesito un motor OSINT/SOCMINT con GitHub, Brave, Selenium y export JSON" \
  --github-results outputs/github_results.json \
  --output outputs/packet_final.json
```

## Manifiesto de skills

Ejemplo editable:

```text
config/skills_manifest.example.json
```

Uso:

```bash
osint-cd llm-plan \
  --request "analizar redes, bots y medios locales en Saladillo" \
  --skills-path config/skills_manifest.example.json \
  --output outputs/packet_saladillo.json
```

## Archivos del módulo

```text
osint_cd/llm/
├── __init__.py
├── schemas.py
├── skills.py
├── repository_discovery.py
└── orchestrator.py
```

## Puerta única conceptual

```text
Pedido del usuario
  ↓
osint-cd llm-plan
  ↓
Packet JSON
  ↓
IA/LLM busca en GitHub + activa skills
  ↓
Packet enriquecido
  ↓
Análisis, ranking, integración o informe
```
