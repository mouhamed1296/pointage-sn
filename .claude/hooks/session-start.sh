#!/bin/bash
# SessionStart hook — prépare le dépôt pour Claude Code on the web :
# installe les dépendances backend/frontend et télécharge les modèles afin que
# les tests et linters soient exécutables pendant la session.
set -euo pipefail

# Ne s'exécute que dans l'environnement distant (Claude Code on the web).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo "[session-start] Installation des dépendances backend…"
cd "$ROOT/backend"
npm install

echo "[session-start] Installation des dépendances frontend…"
cd "$ROOT/frontend"
npm install

# Modèles de reconnaissance faciale (best-effort : nécessite un accès réseau).
echo "[session-start] Téléchargement des modèles face-api (best-effort)…"
( cd "$ROOT/frontend" && npm run download-models ) || \
  echo "[session-start] Modèles frontend non téléchargés (réseau ?)"
( cd "$ROOT/backend" && npm run download-face-models ) || \
  echo "[session-start] Modèles serveur non téléchargés (réseau ?)"

echo "[session-start] Terminé."
