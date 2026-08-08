# =========================================================================
# start-mongod.ps1 — Partie 1.4
# Démarre les 15 instances mongod (3 config servers + 4 shards x 3 nœuds)
# Prérequis : create-arborescence.ps1, generate-keyfile.ps1,
#             generate-mongod-conf.ps1 déjà exécutés
# =========================================================================

$mongo = "C:\Program Files\mongodb-win32-x86_64-windows-8.3.2\bin\mongod.exe"
$base = "C:\MONGODB\Cluster"

if (-not (Test-Path $mongo)) {
    Write-Host "ERREUR : mongod.exe introuvable à $mongo — ajustez le chemin." -ForegroundColor Red
    exit 1
}

# -------------------------
# Config Servers
# -------------------------
for ($i = 0; $i -lt 3; $i++) {
    Start-Process -FilePath $mongo -ArgumentList "--config `"$base\Config\cfg$i\mongod.conf`""
}

# -------------------------
# Shards
# -------------------------
for ($shard = 1; $shard -le 4; $shard++) {
    for ($node = 0; $node -lt 3; $node++) {
        Start-Process -FilePath $mongo -ArgumentList "--config `"$base\Shard$shard\rs$node\mongod.conf`""
    }
}

Write-Host "Les 15 instances mongod ont été lancées."
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Ports MongoDB ouverts :"
netstat -ano | findstr "27019 27020 27021 27100 27101 27102 27110 27111 27112 27120 27121 27122 27130 27131 27132"
