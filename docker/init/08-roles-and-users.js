// 08 — RBAC : rôles métier + utilisateurs de démo + vue filtrante.
// Adapté de Scripts/setup-security.js pour un lancement non-interactif
// (passwordPrompt() remplacé par des mots de passe de démo).
// Exécuté authentifié en tant que 'admin' (root).

const telemedicineDb = db.getSiblingDB("telemedicine");
const adminDb = db.getSiblingDB("admin");

// --- 1. Rôles personnalisés (privilèges scopés sur "telemedicine") -------
telemedicineDb.createRole({
  role: "roleAdmin",
  privileges: [{
    resource: { db: "telemedicine", collection: "" },
    actions: ["find", "insert", "update", "remove", "createIndex", "dropIndex", "createCollection"]
  }],
  roles: []
});

telemedicineDb.createRole({
  role: "roleMedecin",
  privileges: [
    { resource: { db: "telemedicine", collection: "Patients" }, actions: ["find"] },
    { resource: { db: "telemedicine", collection: "Medecins" }, actions: ["find", "update"] },
    { resource: { db: "telemedicine", collection: "RendezVous" }, actions: ["find", "insert", "update"] },
    { resource: { db: "telemedicine", collection: "Consultations" }, actions: ["find", "insert", "update"] },
    { resource: { db: "telemedicine", collection: "Prescriptions" }, actions: ["find", "insert"] },
    { resource: { db: "telemedicine", collection: "AnalysesMedicales" }, actions: ["find", "insert"] }
  ],
  roles: []
});

telemedicineDb.createRole({
  role: "rolePatient",
  privileges: [
    { resource: { db: "telemedicine", collection: "Medecins" }, actions: ["find"] },
    { resource: { db: "telemedicine", collection: "RendezVous" }, actions: ["find", "insert"] },
    { resource: { db: "telemedicine", collection: "Consultations" }, actions: ["find"] },
    { resource: { db: "telemedicine", collection: "Prescriptions" }, actions: ["find"] },
    { resource: { db: "telemedicine", collection: "AnalysesMedicales" }, actions: ["find"] }
  ],
  roles: []
});

// Rôle-marqueur d'identité (exploité par la vue filtrante via $$USER_ROLES)
telemedicineDb.createRole({ role: "access_MED-0001", privileges: [], roles: [] });

// --- 2. Utilisateurs de démo (sur "admin", authSource=admin) --------------
adminDb.createUser({
  user: "dr_diop",
  pwd: "Medecin_2026!",
  roles: [
    { role: "roleMedecin", db: "telemedicine" },
    { role: "access_MED-0001", db: "telemedicine" }
  ],
  customData: { medecin_id: "MED-0001" }
});

adminDb.createUser({
  user: "patient_fall",
  pwd: "Patient_2026!",
  roles: [{ role: "rolePatient", db: "telemedicine" }],
  customData: { patient_id: "PAT-0002" }
});

adminDb.createUser({
  user: "hopital_admin",
  pwd: "Hopital_2026!",
  roles: [{ role: "roleAdmin", db: "telemedicine" }]
});

// --- 3. Vue filtrante document-level pour les médecins ($$USER_ROLES) -----
telemedicineDb.createView("MesPatients", "Consultations", [{
  $match: {
    $expr: { $in: [{ $concat: ["access_", "$medecin_id"] }, "$$USER_ROLES.role"] }
  }
}]);

telemedicineDb.createRole({
  role: "roleMedecinStrict",
  privileges: [{ resource: { db: "telemedicine", collection: "MesPatients" }, actions: ["find"] }],
  roles: []
});

adminDb.grantRolesToUser("dr_diop", [{ role: "roleMedecinStrict", db: "telemedicine" }]);

print("=== RBAC configuré (roles + utilisateurs de démo) ===");
