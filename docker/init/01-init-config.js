// 01 — Initialise le replica set des config servers (ConfigRS, 3 nœuds).
// Exécuté via: docker exec -i cfg0 mongosh --port 27019 (exception localhost).
rs.initiate({
  _id: "ConfigRS",
  configsvr: true,
  members: [
    { _id: 0, host: "cfg0:27019" },
    { _id: 1, host: "cfg1:27019" },
    { _id: 2, host: "cfg2:27019" }
  ]
});
