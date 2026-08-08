// 07 — Crée le compte super-admin (root). PREMIER utilisateur du cluster :
// autorisé sans mot de passe grâce à l'exception localhost, qui se ferme
// définitivement juste après. Toute connexion suivante exige une authentification.
db = db.getSiblingDB("admin");
db.createUser({
  user: "admin",
  pwd: "ChangeMoiEnProd_2026!",   // ⚠️ secret de démo — à remplacer en prod
  roles: [{ role: "root", db: "admin" }]
});
print("Utilisateur 'admin' (root) créé. L'authentification est désormais requise.");
