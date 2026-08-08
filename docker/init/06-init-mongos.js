// 06 — Rattache les 4 shards au routeur mongos.
// Exécuté AVANT la création de l'admin (exception localhost encore ouverte).
// L'activation du sharding se fait ensuite, authentifiée (voir 09-sharding.js).

sh.addShard("ShardRS1/shard1a:27018,shard1b:27018,shard1c:27018");
sh.addShard("ShardRS2/shard2a:27018,shard2b:27018,shard2c:27018");
sh.addShard("ShardRS3/shard3a:27018,shard3b:27018,shard3c:27018");
sh.addShard("ShardRS4/shard4a:27018,shard4b:27018,shard4c:27018");

print("=== 4 shards rattachés au cluster ===");
sh.status();
