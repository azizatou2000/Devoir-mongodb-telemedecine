// =========================================================================
// demo-consistency.js — Read/Write Concern, sessions causales — Partie 3.4
// Exécution :
//   mongosh "mongodb://admin:<motdepasse>@localhost:27017/telemedicine?authSource=admin" demo-consistency.js
// =========================================================================

db = db.getSiblingDB("telemedicine");

// -------------------------------------------------------------------------
// 1. Écriture critique : prescription — durabilité maximale
// -------------------------------------------------------------------------
print("--- Écriture avec writeConcern majority + journal (prescription) ---");
const resultPrescription = db.Prescriptions.insertOne(
  { patient_id: "PAT-0002", medecin_id: "MED-0001", medicament: "Amoxicilline", date: new Date() },
  { writeConcern: { w: "majority", j: true, wtimeout: 5000 } }
);
printjson(resultPrescription);

// -------------------------------------------------------------------------
// 2. Lecture critique avant délivrance en pharmacie (linearizable)
// -------------------------------------------------------------------------
print("--- Lecture linearizable (dernière version garantie) ---");
printjson(db.Prescriptions.find({ patient_id: "PAT-0002" }).readConcern("linearizable").toArray());

// -------------------------------------------------------------------------
// 3. Lecture tolérante : dashboard des RDV à venir (local, rapide)
// -------------------------------------------------------------------------
print("--- Lecture local (rapide, tolère un léger retard) ---");
printjson(db.RendezVous.find({ statut: "a_venir" }).readConcern("local").limit(5).toArray());

// -------------------------------------------------------------------------
// 4. Session causale : read-your-own-writes
// -------------------------------------------------------------------------
print("--- Session causale : écriture puis relecture garantie ---");
const session = db.getMongo().startSession({ causalConsistency: true });
const sessionDb = session.getDatabase("telemedicine");

sessionDb.Consultations.insertOne(
  { patient_id: "PAT-0002", medecin_id: "MED-0001", notes: "RAS", date: new Date() },
  { writeConcern: { w: "majority" } }
);

printjson(
  sessionDb.Consultations.find({ patient_id: "PAT-0002" }).readConcern("majority").sort({ date: -1 }).limit(1).toArray()
);
session.endSession();

// -------------------------------------------------------------------------
// 5. Transaction multi-documents avec snapshot (dossier médical cohérent)
// -------------------------------------------------------------------------
print("--- Transaction snapshot : extrait de dossier médical cohérent ---");
const session2 = db.getMongo().startSession();
session2.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" }
});

try {
  const patient = session2.getDatabase("telemedicine").Patients.findOne({ patient_id: "PAT-0002" });
  const consultations = session2.getDatabase("telemedicine").Consultations.find({ patient_id: "PAT-0002" }).toArray();
  session2.commitTransaction();
  print("Transaction validée. Patient :");
  printjson(patient);
  print("Nombre de consultations lues dans la même transaction : " + consultations.length);
} catch (e) {
  session2.abortTransaction();
  print("Transaction annulée : " + e);
} finally {
  session2.endSession();
}

print("");
print("=== Démonstration des niveaux de cohérence terminée ===");
