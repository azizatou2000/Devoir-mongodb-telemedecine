// 09 — Active le sharding sur "telemedicine" et distribue les collections.
// Exécuté AUTHENTIFIÉ (admin), comme le prévoit Scripts/setup-sharding.js.
// Idempotent : ignore les collections déjà shardées (relançable sans erreur).

sh.enableSharding("telemedicine");

function shard(ns, key) {
  const coll = ns.split(".")[1];
  try {
    db.getSiblingDB("telemedicine")[coll].createIndex(key);
    sh.shardCollection(ns, key);
    print("  -> " + ns + " shardée sur " + JSON.stringify(key));
  } catch (e) {
    if (String(e).match(/already/i)) print("  -> " + ns + " déjà shardée (ignoré)");
    else throw e;
  }
}

// Distribution uniforme sur patient_id (évite les hotspots)
shard("telemedicine.Patients",          { patient_id: "hashed" });
shard("telemedicine.Consultations",     { patient_id: "hashed" });
shard("telemedicine.Prescriptions",     { patient_id: "hashed" });
shard("telemedicine.AnalysesMedicales", { patient_id: "hashed" });
// Clé composite : planning médecin
shard("telemedicine.RendezVous",        { medecin_id: 1, date_rdv: 1 });

print("=== Sharding activé ===");
sh.status();
