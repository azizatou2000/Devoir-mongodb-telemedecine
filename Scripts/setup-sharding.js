// =========================================================================
// setup-sharding.js — Activation du sharding (clé hashée) — Partie 4.1
// Exécution :
//   mongosh "mongodb://admin:<motdepasse>@localhost:27017/admin?authSource=admin" setup-sharding.js
// =========================================================================

db = db.getSiblingDB("telemedicine");

print("Activation du sharding sur la base 'telemedicine'...");
sh.enableSharding("telemedicine");

// -------------------------------------------------------------------------
// Patients — hash sur patient_id : distribution uniforme, évite les hotspots
// -------------------------------------------------------------------------
db.Patients.createIndex({ patient_id: "hashed" });
sh.shardCollection("telemedicine.Patients", { patient_id: "hashed" });
print("  -> Patients shardée sur { patient_id: 'hashed' }");

// -------------------------------------------------------------------------
// Consultations — même clé pour garder les requêtes patient ciblées
// -------------------------------------------------------------------------
db.Consultations.createIndex({ patient_id: "hashed" });
sh.shardCollection("telemedicine.Consultations", { patient_id: "hashed" });
print("  -> Consultations shardée sur { patient_id: 'hashed' }");

// -------------------------------------------------------------------------
// Prescriptions — idem
// -------------------------------------------------------------------------
db.Prescriptions.createIndex({ patient_id: "hashed" });
sh.shardCollection("telemedicine.Prescriptions", { patient_id: "hashed" });
print("  -> Prescriptions shardée sur { patient_id: 'hashed' }");

// -------------------------------------------------------------------------
// AnalysesMedicales — idem
// -------------------------------------------------------------------------
db.AnalysesMedicales.createIndex({ patient_id: "hashed" });
sh.shardCollection("telemedicine.AnalysesMedicales", { patient_id: "hashed" });
print("  -> AnalysesMedicales shardée sur { patient_id: 'hashed' }");

// -------------------------------------------------------------------------
// RendezVous — clé composite (planning médecin), pas de hash ici
// -------------------------------------------------------------------------
db.RendezVous.createIndex({ medecin_id: 1, date_rdv: 1 });
sh.shardCollection("telemedicine.RendezVous", { medecin_id: 1, date_rdv: 1 });
print("  -> RendezVous shardée sur { medecin_id: 1, date_rdv: 1 }");

print("");
print("=== Sharding activé ===");
printjson(sh.status());
