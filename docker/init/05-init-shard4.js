// 05 — Initialise ShardRS4 (Shard 4, 3 nœuds). Exécuté via docker exec sur shard4a.
rs.initiate({
  _id: "ShardRS4",
  members: [
    { _id: 0, host: "shard4a:27018" },
    { _id: 1, host: "shard4b:27018" },
    { _id: 2, host: "shard4c:27018" }
  ]
});
