# Déploiement Docker — Cluster MongoDB shardé (Télémédecine)

Reproduit en conteneurs la topologie du cluster Windows (`Scripts/*.ps1`), sans
installer MongoDB sur la machine.

## Topologie (16 conteneurs)

| Composant  | Conteneurs              | Replica set | Port interne |
|------------|-------------------------|-------------|--------------|
| Config     | `cfg0` `cfg1` `cfg2`    | `ConfigRS`  | 27019        |
| Shard 1    | `shard1a/b/c`           | `ShardRS1`  | 27018        |
| Shard 2    | `shard2a/b/c`           | `ShardRS2`  | 27018        |
| Shard 3    | `shard3a/b/c`           | `ShardRS3`  | 27018        |
| Shard 4    | `shard4a/b/c`           | `ShardRS4`  | 27018        |
| Routeur    | `mongos`                | —           | **27017** (exposé) |

Authentification interne du cluster via le keyfile partagé `KeyFile/mongodb-keyfile`.

## Prérequis

- **Docker + Docker Compose v2** (`docker compose`, pas `docker-compose`)
- **Port hôte 27017 libre**
- **~4–6 Go de RAM** dispo pour Docker (16 instances mongod). Sur petite
  machine, augmenter la RAM allouée dans Docker Desktop → Settings → Resources.
- **Windows** : lancer `./deploy.sh` depuis **WSL2** ou Git Bash (script bash).
  macOS / Linux : terminal natif.
- Connexion internet au 1er run (pull de l'image `mongo:7.0`, ~700 Mo).

## Portabilité (macOS / Linux / WSL)

Le keyfile n'est **pas** bind-monté directement : le conteneur `keyfile-init`
le copie (depuis `KeyFile/mongodb-keyfile` s'il existe, sinon en génère un) dans
un volume partagé avec `owner=999` + `chmod 400`. Ça évite le piège classique
des permissions de keyfile sur Linux et rend le déploiement identique partout.

Pour partager le projet : envoyer **tout le dossier**. Inclure
`KeyFile/mongodb-keyfile` garde la même clé ; l'omettre en fait générer une
nouvelle automatiquement (les deux marchent). Ne jamais publier ce keyfile sur
un dépôt public (c'est un secret).

## Déploiement

```bash
./deploy.sh                 # cluster seul (structure + sécurité)
WITH_DATA=1 ./deploy.sh     # + index métier + jeu de données de démo
```

Le script : démarre les conteneurs → initialise les replica sets (`rs.initiate`
via `docker exec`, exception localhost) → rattache les shards au `mongos` →
active le sharding → crée l'admin `root` puis les rôles/utilisateurs métier.

## Connexion

```bash
docker exec -it mongos mongosh --port 27017 \
  -u admin -p 'ChangeMoiEnProd_2026!' --authenticationDatabase admin

# Depuis l'hôte / Compass :
mongodb://admin:ChangeMoiEnProd_2026!@localhost:27017/?authSource=admin
```

Vérifier l'état :

```js
sh.status()          // 4 shards enregistrés
rs.status()          // état d'un replica set (depuis un nœud)
```

## Comptes créés

| Utilisateur     | Mot de passe (démo)      | Rôle                          |
|-----------------|--------------------------|-------------------------------|
| `admin`         | `ChangeMoiEnProd_2026!`  | `root`                        |
| `hopital_admin` | `Hopital_2026!`          | `roleAdmin` (telemedicine)    |
| `dr_diop`       | `Medecin_2026!`          | `roleMedecin` + vue filtrante |
| `patient_fall`  | `Patient_2026!`          | `rolePatient`                 |

> ⚠️ Mots de passe de démonstration. À changer avant tout usage réel, et ne
> jamais committer le keyfile sur un dépôt public.

## Arrêt

```bash
./teardown.sh            # stoppe les conteneurs, GARDE les données (volumes)
./teardown.sh --purge    # stoppe + EFFACE les volumes (remise à zéro)
```

## Fichiers

- `docker-compose.yml` — 16 mongo + `keyfile-init` + réseau + volumes
- `deploy.sh` / `teardown.sh` — déploiement / arrêt
- `docker/init/*.js` — init : `01-05` replica sets, `06` addShard, `07` admin,
  `08` RBAC, `09` sharding des collections
- `KeyFile/mongodb-keyfile` — clé d'auth interne (perms gérées par `keyfile-init`)
