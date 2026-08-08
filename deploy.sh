#!/bin/bash
# =========================================================================
# deploy.sh — Déploiement automatique du cluster MongoDB shardé (Docker)
# Topologie : 3 config servers + 4 shards x 3 nœuds + mongos = 16 conteneurs.
# Prérequis : Docker + Docker Compose. Lancer depuis le dossier du projet.
# =========================================================================
set -e
cd "$(dirname "$0")"

ADMIN_PWD="ChangeMoiEnProd_2026!"

echo "==> 0/8 : keyfile..."
if [ -f KeyFile/mongodb-keyfile ]; then
  echo "    Keyfile fourni détecté (KeyFile/mongodb-keyfile) — il sera réutilisé."
else
  echo "    Aucun keyfile fourni — le conteneur 'keyfile-init' en générera un."
fi
echo "    (perms/owner gérés dans le conteneur keyfile-init : portable macOS/Linux/WSL)"

echo "==> 1/8 : démarrage des conteneurs (init keyfile + 16 mongo)..."
docker compose up -d

echo "==> Attente du démarrage des instances mongod (25s)..."
sleep 25

echo "==> 2/8 : initialisation du replica set des config servers (ConfigRS)..."
docker exec -i cfg0 mongosh --port 27019 < docker/init/01-init-config.js
sleep 5

echo "==> 3/8 : initialisation des 4 shards (3 nœuds chacun)..."
docker exec -i shard1a mongosh --port 27018 < docker/init/02-init-shard1.js
docker exec -i shard2a mongosh --port 27018 < docker/init/03-init-shard2.js
docker exec -i shard3a mongosh --port 27018 < docker/init/04-init-shard3.js
docker exec -i shard4a mongosh --port 27018 < docker/init/05-init-shard4.js

echo "==> Attente de la stabilisation des élections (20s)..."
sleep 20

echo "==> 4/8 : rattachement des 4 shards au mongos..."
docker exec -i mongos mongosh --port 27017 < docker/init/06-init-mongos.js

echo "==> 5/8 : création du compte admin (exception localhost, une seule fois)..."
docker exec -i mongos mongosh --port 27017 < docker/init/07-init-admin.js

echo "==> 6/8 : création des rôles métier + utilisateurs de démo..."
docker exec -i mongos mongosh --port 27017 \
  -u admin -p "$ADMIN_PWD" --authenticationDatabase admin \
  < docker/init/08-roles-and-users.js

echo "==> 7/8 : activation du sharding + distribution des collections..."
docker exec -i mongos mongosh --port 27017 \
  -u admin -p "$ADMIN_PWD" --authenticationDatabase admin \
  < docker/init/09-sharding.js

echo "==> 8/8 : (optionnel) index métier + jeu de données de démo..."
if [ "${WITH_DATA:-0}" = "1" ]; then
  docker exec -i mongos mongosh "mongodb://admin:$ADMIN_PWD@localhost:27017/telemedicine?authSource=admin" < Scripts/setup-indexes.js
  docker exec -i mongos mongosh "mongodb://admin:$ADMIN_PWD@localhost:27017/telemedicine?authSource=admin" < Scripts/generate-data.js
else
  echo "    (ignoré — relancer avec WITH_DATA=1 ./deploy.sh pour charger index + données)"
fi

echo ""
echo "✅ Cluster prêt, sécurisé et shardé. Point d'entrée : mongos sur le port 27017."
echo "   Connexion admin :"
echo "     docker exec -it mongos mongosh --port 27017 -u admin -p '$ADMIN_PWD' --authenticationDatabase admin"
echo "   Vérifier les shards :  sh.status()"
