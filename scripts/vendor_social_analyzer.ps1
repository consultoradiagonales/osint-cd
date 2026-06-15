param(
  [string]$VendorDir = "vendor/social-analyzer"
)

$ErrorActionPreference = "Stop"
$Upstream = "https://github.com/qeeqbox/social-analyzer.git"
$Parent = Split-Path $VendorDir -Parent
if ($Parent -and !(Test-Path $Parent)) {
  New-Item -ItemType Directory -Force -Path $Parent | Out-Null
}

if (Test-Path (Join-Path $VendorDir ".git")) {
  Write-Host "Updating $VendorDir"
  git -C $VendorDir pull --ff-only
} else {
  Write-Host "Cloning $Upstream into $VendorDir"
  git clone $Upstream $VendorDir
}

Write-Host ""
Write-Host "social-analyzer listo."
Write-Host "Instalacion sugerida:"
Write-Host "  python -m venv .venv"
Write-Host "  .\.venv\Scripts\Activate.ps1"
Write-Host "  pip install -e ."
Write-Host "  pip install -r requirements-social-analyzer.txt"
Write-Host ""
Write-Host "Prueba:"
Write-Host "  osint-cd social-analyzer --username johndoe --output outputs/social_johndoe.json"
