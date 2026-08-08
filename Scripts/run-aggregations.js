// =========================================================================
// run-aggregations.js — Pipelines d'agrégation — Partie 5.4
// Exécution :
//   mongosh "mongodb://admin:<motdepasse>@localhost:27017/telemedicine?authSource=admin" run-aggregations.js
// =========================================================================

db = db.getSiblingDB("telemedicine");

// -------------------------------------------------------------------------
// 1. Top 10 des médecins les plus consultés
// -------------------------------------------------------------------------
print("=== Top 10 des médecins les plus consultés ===");
printjson(
  db.Consultations.aggregate([
    { $group: { _id: "$medecin_id", totalConsultations: { $sum: 1 } } },
    { $sort: { totalConsultations: -1 } },
    { $limit: 10 },
    { $lookup: { from: "Medecins", localField: "_id", foreignField: "medecin_id", as: "info" } },
    { $unwind: "$info" },
    { $project: { _id: 0, medecin_id: "$_id", totalConsultations: 1, nom: "$info.nom", specialite: "$info.specialite" } }
  ]).toArray()
);

// -------------------------------------------------------------------------
// 2. Volume de consultations par mois (tendance d'activité)
// -------------------------------------------------------------------------
print("");
print("=== Volume de consultations par mois ===");
printjson(
  db.Consultations.aggregate([
    { $group: { _id: { annee: { $year: "$date" }, mois: { $month: "$date" } }, total: { $sum: 1 } } },
    { $sort: { "_id.annee": 1, "_id.mois": 1 } }
  ]).toArray()
);

// -------------------------------------------------------------------------
// 3. Répartition des patients par région (vérifie l'équilibre du zone sharding)
// -------------------------------------------------------------------------
print("");
print("=== Répartition des patients par région ===");
printjson(
  db.Patients.aggregate([
    { $group: { _id: "$region", total: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]).toArray()
);
