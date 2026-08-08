// =========================================================================
// run-benchmark.js — Benchmark de requêtes (avec/sans index, ciblée/scatter) — Partie 5.5
// Exécution :
//   mongosh "mongodb://admin:<motdepasse>@localhost:27017/telemedicine?authSource=admin" run-benchmark.js
// =========================================================================

db = db.getSiblingDB("telemedicine");

function benchmark(label, fn, iterations = 20) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    fn();
    times.push(Date.now() - start);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  print(
    label + " -> Moyenne: " + avg.toFixed(2) + " ms | Min: " + Math.min(...times) + " ms | Max: " + Math.max(...times) + " ms"
  );
  return avg;
}

// -------------------------------------------------------------------------
// 1. Comparaison AVANT / APRÈS index sur { medecin_id: 1, date: -1 }
// -------------------------------------------------------------------------
print("=== Benchmark : find({medecin_id}) trié par date ===");

try {
  db.Consultations.dropIndex({ medecin_id: 1, date: -1 });
} catch (e) {
  print("(index déjà absent, on continue)");
}

const avgSansIndex = benchmark("SANS index", () =>
  db.Consultations.find({ medecin_id: "MED-00123" }).sort({ date: -1 }).toArray()
);

db.Consultations.createIndex({ medecin_id: 1, date: -1 });

const avgAvecIndex = benchmark("AVEC index", () =>
  db.Consultations.find({ medecin_id: "MED-00123" }).sort({ date: -1 }).toArray()
);

print("Gain approximatif : " + ((1 - avgAvecIndex / avgSansIndex) * 100).toFixed(1) + " %");

// -------------------------------------------------------------------------
// 2. Requête ciblée (shard key) vs scatter-gather
// -------------------------------------------------------------------------
print("");
print("=== Benchmark : requête ciblée vs scatter-gather ===");

benchmark("Ciblée (patient_id fourni, shard key)", () =>
  db.Consultations.find({ patient_id: "PAT-000123" }).toArray()
);

benchmark("Scatter-gather (sans shard key)", () =>
  db.Consultations.find({ "symptomes.0": { $exists: true } }).limit(50).toArray()
);

// -------------------------------------------------------------------------
// 3. Agrégation top médecins
// -------------------------------------------------------------------------
print("");
print("=== Benchmark : agrégation top 10 médecins ===");

benchmark(
  "Top 10 médecins (agrégation)",
  () =>
    db.Consultations
      .aggregate([
        { $group: { _id: "$medecin_id", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ])
      .toArray(),
  5
);

print("");
print("=== Récapitulatif à reporter dans le tableau 5.6 du rapport ===");
print("Requête                                  | Sans index (ms) | Avec index (ms)");
print("find({medecin_id}) triée par date        | " + avgSansIndex.toFixed(2) + "            | " + avgAvecIndex.toFixed(2));
