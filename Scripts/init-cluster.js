// =========================================================================
// init-cluster.js — Initialisation des replica sets + rattachement au cluster
// Partie 1.5 (rs.initiate) et 1.7 (sh.addShard)
//
// Prérequis :
//   - Les 15 mongod (config servers + shards) et mongos doivent déjà tourner
//     (Étapes 1.1 à 1.4 et 1.6, en PowerShell — non convertibles en JS).
//   - Aucun utilisateur créé pour l'instant (localhost exception active).
//     Ce script doit s'exécuter AVANT la création du compte admin (Partie 2).
//
// Exécution (--nodb car le script se connecte lui-même à plusieurs hôtes) :
//   mongosh --nodb init-cluster.js
// =========================================================================

function initReplicaSet(port, rsConfig) {
  print("Connexion à localhost:" + port + " pour initialiser " + rsConfig._id + "...");
  db = new Mongo("localhost:" + port).getDB("admin");
  const result = rs.initiate(rsConfig);
  printjson(result);
  sleep(3000);
}

// -------------------------------------------------------------------------
// 1. Config Servers
// -------------------------------------------------------------------------
initReplicaSet(27019, {
  _id: "ConfigRS",
  configsvr: true,
  members: [
    { _id: 0, host: "localhost:27019" },
    { _id: 1, host: "localhost:27020" },
    { _id: 2, host: "localhost:27021" }
  ]
});

// -------------------------------------------------------------------------
// 2. Shard 1 (region = Dakar/Ouest)
// -------------------------------------------------------------------------
initReplicaSet(27100, {
  _id: "ShardRS1",
  members: [
    { _id: 0, host: "localhost:27100" },
    { _id: 1, host: "localhost:27101" },
    { _id: 2, host: "localhost:27102" }
  ]
});

// -------------------------------------------------------------------------
// 3. Shard 2 (region = Afrique Centrale)
// -------------------------------------------------------------------------
initReplicaSet(27110, {
  _id: "ShardRS2",
  members: [
    { _id: 0, host: "localhost:27110" },
    { _id: 1, host: "localhost:27111" },
    { _id: 2, host: "localhost:27112" }
  ]
});

// -------------------------------------------------------------------------
// 4. Shard 3 (region = Europe)
// -------------------------------------------------------------------------
initReplicaSet(27120, {
  _id: "ShardRS3",
  members: [
    { _id: 0, host: "localhost:27120" },
    { _id: 1, host: "localhost:27121" },
    { _id: 2, host: "localhost:27122" }
  ]
});

// -------------------------------------------------------------------------
// 5. Shard 4 (region = Amérique)
// -------------------------------------------------------------------------
initReplicaSet(27130, {
  _id: "ShardRS4",
  members: [
    { _id: 0, host: "localhost:27130" },
    { _id: 1, host: "localhost:27131" },
    { _id: 2, host: "localhost:27132" }
  ]
});

// -------------------------------------------------------------------------
// 6. Attente de la stabilisation des élections avant le rattachement
// -------------------------------------------------------------------------
print("Attente de la stabilisation des élections (15s)...");
sleep(15000);

// -------------------------------------------------------------------------
// 7. Rattachement des 4 shards via le routeur mongos
// -------------------------------------------------------------------------
print("Connexion au routeur mongos (port 27017)...");
db = new Mongo("localhost:27017").getDB("admin");

print("Ajout des shards au cluster...");
printjson(sh.addShard("ShardRS1/localhost:27100,localhost:27101,localhost:27102"));
printjson(sh.addShard("ShardRS2/localhost:27110,localhost:27111,localhost:27112"));
printjson(sh.addShard("ShardRS3/localhost:27120,localhost:27121,localhost:27122"));
printjson(sh.addShard("ShardRS4/localhost:27130,localhost:27131,localhost:27132"));

print("");
print("=== Cluster initialisé ===");
printjson(sh.status());
