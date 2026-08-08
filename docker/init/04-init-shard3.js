// 04 — Initialise ShardRS3 (Shard 3, 3 nœuds). Exécuté via docker exec sur shard3a.
rs.initiate({
  _id: "ShardRS3",
  members: [
    { _id: 0, host: "shard3a:27018" },
    { _id: 1, host: "shard3b:27018" },
    { _id: 2, host: "shard3c:27018" }
  ]
});
