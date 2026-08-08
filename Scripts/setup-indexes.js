// =========================================================================
// setup-indexes.js — Indexation ciblée — Partie 5.2
// Exécution :
//   mongosh "mongodb://admin:<motdepasse>@localhost:27017/telemedicine?authSource=admin" setup-indexes.js
// =========================================================================

db = db.getSiblingDB("telemedicine");

print("Création des index métier...");

// Historique d'un patient trié par date (requête la plus fréquente)
db.Consultations.createIndex({ patient_id: 1, date: -1 });
print("  -> Consultations { patient_id: 1, date: -1 }");

// Planning d'un médecin
db.Consultations.createIndex({ medecin_id: 1, date: -1 });
print("  -> Consultations { medecin_id: 1, date: -1 }");

// Recherche de médecin par spécialité + région
db.Medecins.createIndex({ specialite: 1, region: 1 });
print("  -> Medecins { specialite: 1, region: 1 }");

// Recherche texte (annuaire médecins)
db.Medecins.createIndex({ nom: "text", prenom: "text" });
print("  -> Medecins { nom: 'text', prenom: 'text' }");

// Index TTL : purge automatique des sessions expirées (sécurité)
db.SessionsActives.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
print("  -> SessionsActives TTL sur createdAt (3600s)");

print("");
print("=== Index en place ===");
printjson(db.Consultations.getIndexes());
printjson(db.Medecins.getIndexes());
