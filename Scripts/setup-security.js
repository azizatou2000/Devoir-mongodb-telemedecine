// =========================================================================
// setup-security.js — RBAC (Admin / Médecin / Patient) — Partie 2.3 / 2.4
// Prérequis : le compte "admin" (root) doit déjà exister (localhost exception).
// Exécution (depuis une session mongosh déjà connectée en admin) :
//   load("C:/MONGODB/Cluster/Scripts/setup-security.js")
//
// CORRECTIF v2 :
//   - Les utilisateurs sont créés sur la base "admin" (et non "telemedicine"),
//     pour rester cohérent avec authSource=admin utilisé partout ailleurs
//     dans le projet. Leurs privilèges restent scopés sur "telemedicine"
//     via { role: "...", db: "telemedicine" }.
//   - La vue filtrante n'utilise plus "$$USER" (variable inexistante dans
//     MongoDB) mais la vraie variable système "$$USER_ROLES" (>= 5.0),
//     couplée à un rôle d'accès par médecin qui encode son identifiant.
// =========================================================================

const telemedicineDb = db.getSiblingDB("telemedicine");
const adminDb = db.getSiblingDB("admin");

// -------------------------------------------------------------------------
// 1. Rôles personnalisés (définis dans telemedicine, où portent les privilèges)
// -------------------------------------------------------------------------
print("Création du rôle roleAdmin...");
telemedicineDb.createRole({
  role: "roleAdmin",
  privileges: [
    {
      resource: { db: "telemedicine", collection: "" },
      actions: ["find", "insert", "update", "remove", "createIndex", "dropIndex", "createCollection"]
    }
  ],
  roles: []
});

print("Création du rôle roleMedecin...");
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

print("Création du rôle rolePatient...");
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

// -------------------------------------------------------------------------
// 1bis. Rôle d'accès individuel pour dr_diop (exploité par la vue filtrante)
//       Un rôle "vide" (aucun privilège), qui sert uniquement de marqueur
//       d'identité vérifiable via $$USER_ROLES dans une agrégation.
// -------------------------------------------------------------------------
print("Création du rôle d'accès individuel access_MED-0001...");
telemedicineDb.createRole({
  role: "access_MED-0001",
  privileges: [],
  roles: []
});

// -------------------------------------------------------------------------
// 2. Utilisateurs de démonstration — créés sur "admin" (authSource=admin)
//    NOTE : passwordPrompt() nécessite une session interactive (load()),
//    pas un appel "mongosh fichier.js" en argument direct.
// -------------------------------------------------------------------------
print("Création des utilisateurs de démonstration (base: admin)...");

adminDb.createUser({
  user: "dr_diop",
  pwd: passwordPrompt(),
  roles: [
    { role: "roleMedecin", db: "telemedicine" },
    { role: "access_MED-0001", db: "telemedicine" }
  ],
  customData: { medecin_id: "MED-0001" }
});

adminDb.createUser({
  user: "patient_fall",
  pwd: passwordPrompt(),
  roles: [{ role: "rolePatient", db: "telemedicine" }],
  customData: { patient_id: "PAT-0002" }
});

adminDb.createUser({
  user: "hopital_admin",
  pwd: passwordPrompt(),
  roles: [{ role: "roleAdmin", db: "telemedicine" }]
});

// -------------------------------------------------------------------------
// 3. Vue filtrante document-level pour les médecins (via $$USER_ROLES)
//    Le rôle "access_MED-0001" porté par l'utilisateur encode son medecin_id.
//    On vérifie que le rôle "access_<medecin_id du document>" fait partie
//    des rôles effectifs de la session courante.
// -------------------------------------------------------------------------
print("Création de la vue MesPatients ($$USER_ROLES)...");
telemedicineDb.createView(
  "MesPatients",
  "Consultations",
  [
    {
      $match: {
        $expr: {
          $in: [
            { $concat: ["access_", "$medecin_id"] },
            "$$USER_ROLES.role"
          ]
        }
      }
    }
  ]
);

telemedicineDb.createRole({
  role: "roleMedecinStrict",
  privileges: [
    { resource: { db: "telemedicine", collection: "MesPatients" }, actions: ["find"] }
  ],
  roles: []
});

// Le rôle qui donne accès à la vue doit être attribué explicitement :
// avoir accès à la collection source (Consultations) ne donne pas accès
// à une vue construite dessus, ce sont deux ressources distinctes.
print("Attribution de roleMedecinStrict à dr_diop...");
adminDb.grantRolesToUser("dr_diop", [ { role: "roleMedecinStrict", db: "telemedicine" } ]);

print("");
print("=== Configuration RBAC terminée ===");
printjson(telemedicineDb.getRoles({ showPrivileges: true }));
printjson(adminDb.getUsers());

print("");
print("Test à faire manuellement pour valider la vue filtrante :");
print('  mongosh "mongodb://dr_diop@localhost:27017/telemedicine?authSource=admin" -p');
print("  db.MesPatients.find()   // ne doit renvoyer que les consultations de MED-0001");
