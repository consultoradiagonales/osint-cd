#!/usr/bin/env bash
set -euo pipefail

VENDOR_DIR="${1:-vendor/social-analyzer}"
UPSTREAM="https://github.com/qeeqbox/social-analyzer.git"

mkdir -p "$(dirname "$VENDOR_DIR")"

if [ -d "$VENDOR_DIR/.git" ]; then
  echo "Updating $VENDOR_DIR"
  git -C "$VENDOR_DIR" pull --ff-only
else
  echo "Cloning $UPSTREAM into $VENDOR_DIR"
  git clone "$UPSTREAM" "$VENDOR_DIR"
fi

cat <<'MSG'

social-analyzer listo.
Instalación sugerida:
  python -m venv .venv
  source .venv/bin/activate
  pip install -e .
  pip install -r requirements-social-analyzer.txt

Prueba:
  osint-cd social-analyzer --username johndoe --output outputs/social_johndoe.json
MSG
