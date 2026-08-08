// =========================================================================
// setup-zone-sharding.js — Zone sharding par région — Partie 4.2
// Prérequis : les 4 shards (ShardRS1..4) doivent déjà être rattachés au cluster.
// Exécution :
//   mongosh "mongodb://admin:<motdepasse>@localhost:27017/admin?authSource=admin" setup-zone-sharding.js
// =========================================================================

db = db.getSiblingDB("telemedicine");

// -------------------------------------------------------------------------
// 1. Association d'un tag de zone à chaque shard
// -------------------------------------------------------------------------
print("Tagging des shards par zone géographique...");
sh.addShardTag("ShardRS1", "AFRIQUE_OUEST");     // Sénégal, Mali, Côte d'Ivoire...
sh.addShardTag("ShardRS2", "AFRIQUE_CENTRALE");  // Cameroun, Gabon...
sh.addShardTag("ShardRS3", "EUROPE");            // diaspora Europe
sh.addShardTag("ShardRS4", "AMERIQUE");          // diaspora Amérique

// -------------------------------------------------------------------------
// 2. Collection avec clé composite { region, patient_id: hashed }
// -------------------------------------------------------------------------
print("Création et sharding de PatientsZoned...");
db.PatientsZoned.createIndex({ region: 1, patient_id: "hashed" });
sh.shardCollection("telemedicine.PatientsZoned", { region: 1, patient_id: "hashed" });

// -------------------------------------------------------------------------
// 3. Association des plages de tags (une par région)
// -------------------------------------------------------------------------
print("Définition des plages de tags...");
sh.addTagRange(
  "telemedicine.PatientsZoned",
  { region: "AFRIQUE_OUEST", patient_id: MinKey },
  { region: "AFRIQUE_OUEST", patient_id: MaxKey },
  "AFRIQUE_OUEST"
);

sh.addTagRange(
  "telemedicine.PatientsZoned",
  { region: "AFRIQUE_CENTRALE", patient_id: MinKey },
  { region: "AFRIQUE_CENTRALE", patient_id: MaxKey },
  "AFRIQUE_CENTRALE"
);

sh.addTagRange(
  "telemedicine.PatientsZoned",
  { region: "EUROPE", patient_id: MinKey },
  { region: "EUROPE", patient_id: MaxKey },
  "EUROPE"
);

sh.addTagRange(
  "telemedicine.PatientsZoned",
  { region: "AMERIQUE", patient_id: MinKey },
  { region: "AMERIQUE", patient_id: MaxKey },
  "AMERIQUE"
);

// -------------------------------------------------------------------------
// 4. Échantillon de test + vérification du placement
// -------------------------------------------------------------------------
print("Insertion d'un échantillon de test...");
db.PatientsZoned.insertMany([
  { patient_id: "PAT-0001", region: "AFRIQUE_OUEST", nom: "Diop", age: 34 },
  { patient_id: "PAT-0002", region: "EUROPE", nom: "Fall", age: 51 },
  { patient_id: "PAT-0003", region: "AMERIQUE", nom: "Ndiaye", age: 29 },
  { patient_id: "PAT-0004", region: "AFRIQUE_CENTRALE", nom: "Sow", age: 45 }
]);

print("");
print("=== Répartition des documents par shard (attendre la migration du balancer) ===");
printjson(db.PatientsZoned.getShardDistribution());

print("");
print("=== Comparaison : requête ciblée (1 shard) vs scatter-gather ===");
print("--- PatientsZoned filtrée par region (ciblée) ---");
printjson(db.PatientsZoned.find({ region: "AFRIQUE_OUEST" }).explain("executionStats").queryPlanner.winningPlan);

print("--- Patients sans filtre region (scatter-gather sur 4 shards) ---");
printjson(db.Patients.find({}).explain("executionStats").queryPlanner.winningPlan);
