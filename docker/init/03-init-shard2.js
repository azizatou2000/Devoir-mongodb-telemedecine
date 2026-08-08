// 03 — Initialise ShardRS2 (Shard 2, 3 nœuds). Exécuté via docker exec sur shard2a.
rs.initiate({
  _id: "ShardRS2",
  members: [
    { _id: 0, host: "shard2a:27018" },
    { _id: 1, host: "shard2b:27018" },
    { _id: 2, host: "shard2c:27018" }
  ]
});
