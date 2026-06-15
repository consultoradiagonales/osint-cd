# Integración qeeqbox/social-analyzer

Repositorio upstream: https://github.com/qeeqbox/social-analyzer

`osint-cd` integra `social-analyzer` como dependencia externa/adaptador, no como copia directa dentro del core. Esto evita romper el motor principal y mantiene separada la licencia AGPL-3.0 del upstream.

## Instalación rápida

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
pip install -r requirements-social-analyzer.txt
```

## Clonado local del upstream

Linux/macOS:

```bash
bash scripts/vendor_social_analyzer.sh
```

Windows PowerShell:

```powershell
.\scripts\vendor_social_analyzer.ps1
```

Esto clona o actualiza:

```text
vendor/social-analyzer
```

## Uso CLI

```bash
osint-cd social-analyzer --username johndoe --output outputs/social_johndoe.json
```

Varios usernames:

```bash
osint-cd social-analyzer --username johndoe janedoe --output outputs/social_multi.json
```

Export CSV:

```bash
osint-cd social-analyzer --username johndoe --output outputs/social_johndoe.csv --format csv
```

Limitar sitios:

```bash
osint-cd social-analyzer --username johndoe --website youtube --website tiktok --output outputs/social_selected.json
```

Metadata/extract:

```bash
osint-cd social-analyzer --username johndoe --metadata --extract --output outputs/social_meta.json
```

## Esquema normalizado

Cada resultado queda normalizado a:

```json
{
  "run_id": "uuid",
  "username_query": "johndoe",
  "source": "platform/site",
  "profile_url": "https://...",
  "rate": 90,
  "status": "detected",
  "title": "...",
  "text": "...",
  "metadata": [],
  "extracted": [],
  "captured_at": "2026-06-15T...Z",
  "raw": {}
}
```

## Arquitectura

```text
osint_cd/integrations/social_analyzer.py
  ├─ SocialAnalyzerConfig
  ├─ SocialAnalyzerAdapter
  └─ SocialAnalyzerProfile

osint_cd/cli.py
  └─ osint-cd social-analyzer
```

## Nota de licencia

`qeeqbox/social-analyzer` declara licencia AGPL-3.0. Por eso se usa como dependencia externa o checkout local en `vendor/social-analyzer`, sin copiar su código fuente al core de `osint-cd`.
