// =========================================================================
// generate-data.js — Génération du jeu de données (version allégée)
// Exécution :
//   mongosh "mongodb://admin@localhost:27017/telemedicine?authSource=admin&serverSelectionTimeoutMS=20000" -p generate-data.js
// ou depuis une session mongosh déjà ouverte :
//   load("C:/MONGODB/Cluster/Scripts/generate-data.js")
//
// NOTE : volumes réduits par rapport à la version initiale (5000/200000/500000)
// pour rester raisonnable sur une machine où 16 processus MongoDB tournent
// déjà en simultané. Suffisant pour démontrer index, agrégations, benchmark
// et le filtrage RBAC — augmentez NB_* si votre machine le permet.
// =========================================================================

const dbName = "telemedicine";
db = db.getSiblingDB(dbName);

// -------------------------------------------------------------------------
// Paramètres de volumétrie (allégés)
// -------------------------------------------------------------------------
const NB_MEDECINS = 500;
const NB_PATIENTS = 5000;
const NB_CONSULTATIONS = 20000;
const BATCH_SIZE = 1000; // taille des lots d'insertion

const dateDebut = new Date("2024-01-01");
const dateFin = new Date("2026-07-01");

const prenoms = ["Awa", "Moussa", "Fatou", "Ibrahima", "Aissatou", "Cheikh", "Mariama", "Ousmane", "Khady", "Mamadou"];
const noms = ["Diop", "Ndiaye", "Fall", "Sow", "Diallo", "Ba", "Gueye", "Sarr", "Kane", "Cisse"];
const regions = ["AFRIQUE_OUEST", "AFRIQUE_CENTRALE", "EUROPE", "AMERIQUE"];
const specialites = ["Généraliste", "Cardiologue", "Pédiatre", "Dermatologue", "Gynécologue", "Neurologue", "Psychiatre"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// -------------------------------------------------------------------------
// 1. Médecins — on garde MED-00001 pour dr_diop, cohérent avec le RBAC
// -------------------------------------------------------------------------
print("Génération de " + NB_MEDECINS + " médecins...");
db.Medecins.deleteMany({});

let batch = [];
for (let i = 1; i <= NB_MEDECINS; i++) {
  batch.push({
    medecin_id: "MED-" + String(i).padStart(4, "0"),
    nom: i === 1 ? "Diop" : randomChoice(noms),
    prenom: randomChoice(prenoms),
    specialite: randomChoice(specialites),
    region: randomChoice(regions),
    numero_ordre: "ORD-" + (100000 + i)
  });
  if (batch.length === BATCH_SIZE) {
    db.Medecins.insertMany(batch);
    batch = [];
  }
}
if (batch.length) db.Medecins.insertMany(batch);
print("  -> " + db.Medecins.countDocuments() + " médecins insérés");

// -------------------------------------------------------------------------
// 2. Patients — on garde PAT-0002 pour patient_fall, cohérent avec le RBAC
// -------------------------------------------------------------------------
print("Génération de " + NB_PATIENTS + " patients...");
db.Patients.deleteMany({});

batch = [];
for (let i = 1; i <= NB_PATIENTS; i++) {
  batch.push({
    patient_id: "PAT-" + String(i).padStart(4, "0"),
    nom: i === 2 ? "Fall" : randomChoice(noms),
    prenom: randomChoice(prenoms),
    age: 1 + Math.floor(Math.random() * 95),
    region: randomChoice(regions),
    groupe_sanguin: randomChoice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
    allergies: Math.random() < 0.15 ? [randomChoice(["Pénicilline", "Arachide", "Pollen", "Latex"])] : []
  });
  if (batch.length === BATCH_SIZE) {
    db.Patients.insertMany(batch);
    batch = [];
  }
}
if (batch.length) db.Patients.insertMany(batch);
print("  -> " + db.Patients.countDocuments() + " patients insérés");

// -------------------------------------------------------------------------
// 3. Consultations — on force quelques documents avec medecin_id = MED-0001
//    pour que le test de la vue MesPatients (RBAC) renvoie des résultats.
// -------------------------------------------------------------------------
print("Génération de " + NB_CONSULTATIONS + " consultations...");
db.Consultations.deleteMany({});

batch = [];
for (let i = 1; i <= NB_CONSULTATIONS; i++) {
  const forceDrDiop = i <= 20; // les 20 premières consultations sont assignées à MED-0001
  batch.push({
    consultation_id: "CONS-" + i,
    patient_id: "PAT-" + String(1 + Math.floor(Math.random() * NB_PATIENTS)).padStart(4, "0"),
    medecin_id: forceDrDiop ? "MED-0001" : "MED-" + String(1 + Math.floor(Math.random() * NB_MEDECINS)).padStart(4, "0"),
    date: randomDate(dateDebut, dateFin),
    symptomes: [randomChoice(["fièvre", "toux", "fatigue", "douleur", "maux de tête"])],
    notes: "RAS"
  });
  if (batch.length === BATCH_SIZE) {
    db.Consultations.insertMany(batch);
    batch = [];
  }
}
if (batch.length) db.Consultations.insertMany(batch);
print("  -> " + db.Consultations.countDocuments() + " consultations insérées");

// -------------------------------------------------------------------------
// Résumé
// -------------------------------------------------------------------------
print("");
print("=== Génération terminée (version allégée) ===");
print("Médecins      : " + db.Medecins.countDocuments());
print("Patients      : " + db.Patients.countDocuments());
print("Consultations : " + db.Consultations.countDocuments());
print("Consultations assignées à MED-0001 (pour test RBAC) : " + db.Consultations.countDocuments({ medecin_id: "MED-0001" }));
