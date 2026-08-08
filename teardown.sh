#!/bin/bash
# teardown.sh — Arrête et supprime le cluster.
#   ./teardown.sh          -> arrête + supprime les conteneurs (garde les données)
#   ./teardown.sh --purge  -> supprime AUSSI les volumes (efface toutes les données)
set -e
cd "$(dirname "$0")"
if [ "$1" = "--purge" ]; then
  echo "==> Arrêt + suppression des conteneurs ET des volumes (données effacées)..."
  docker compose down -v
else
  echo "==> Arrêt + suppression des conteneurs (volumes conservés)..."
  docker compose down
fi
echo "✅ Terminé."
