#!/bin/bash
# Sube los cambios del sitio a GitHub -> Vercel hace el deploy automático.
set -e
cd "$(dirname "$0")"

if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "${1:-Update site}"
fi

git push origin main
echo "Listo. Vercel va a desplegar los cambios en 1-2 minutos."
