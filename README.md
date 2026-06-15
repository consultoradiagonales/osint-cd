# OSINT-CD

Motor OSINT/SOCMINT de Consultora Diagonales para renderizado público con Brave/Selenium, normalización de evidencia y exportación JSON/CSV/JSONL.

## Estado actual

Incluye:

- Renderer Brave/Selenium.
- Collectors genéricos `public_web` y `query_template`.
- Exportadores JSON, JSONL y CSV.
- CLI `osint-cd`.
- Integración externa con `qeeqbox/social-analyzer`.

## Instalación

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Con integración social-analyzer:

```bash
pip install -e '.[social]'
```

Alternativa:

```bash
pip install -r requirements.txt
pip install -r requirements-social-analyzer.txt
```

## Clonar upstream qeeqbox/social-analyzer

Linux/macOS:

```bash
bash scripts/vendor_social_analyzer.sh
```

Windows PowerShell:

```powershell
.\scripts\vendor_social_analyzer.ps1
```

## Uso

Render de URL pública:

```bash
osint-cd render --url https://example.com --source example --output outputs/example.json
```

Uso de plantilla de búsqueda:

```bash
osint-cd render \
  --adapter query_template \
  --url 'https://example.com/search?q={query}' \
  --query 'saladillo elecciones 2027' \
  --keyword Saladillo \
  --output outputs/search.json
```

Social Analyzer:

```bash
osint-cd social-analyzer --username johndoe --output outputs/social_johndoe.json
```

Export CSV:

```bash
osint-cd social-analyzer --username johndoe --output outputs/social_johndoe.csv --format csv
```

## Integración qeeqbox/social-analyzer

Documentación específica: `docs/integrations/social-analyzer.md`.

El upstream se mantiene externo para no copiar código AGPL-3.0 dentro del core MIT de `osint-cd`.
