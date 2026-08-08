# =========================================================================
# start-mongos.ps1 — Partie 1.6
# Démarre le routeur mongos, point d'entrée unique du cluster
# Prérequis : les 3 config servers doivent déjà tourner (start-mongod.ps1)
# =========================================================================

$mongos = "C:\Program Files\mongodb-win32-x86_64-windows-8.3.2\bin\mongos.exe"
$keyFile = "C:\MONGODB\Cluster\KeyFile\mongodb-keyfile"

# Si TLS est activé (après generate-tls-certs.ps1), passez ce flag à $true
$tlsEnabled = $false
$tlsPem = "C:\MONGODB\Cluster\TLS\server.pem"
$tlsCA = "C:\MONGODB\Cluster\TLS\ca.crt"

if (-not (Test-Path $mongos)) {
    Write-Host "ERREUR : mongos.exe introuvable à $mongos — ajustez le chemin." -ForegroundColor Red
    exit 1
}

$args = "--configdb ConfigRS/localhost:27019,localhost:27020,localhost:27021 --port 27017 --keyFile `"$keyFile`" --bind_ip_all"

if ($tlsEnabled) {
    $args += " --tlsMode requireTLS --tlsCertificateKeyFile `"$tlsPem`" --tlsCAFile `"$tlsCA`""
}

Start-Process -FilePath $mongos -ArgumentList $args

Start-Sleep -Seconds 5
Write-Host "Routeur mongos démarré (TLS: $tlsEnabled)."
Write-Host ""
netstat -ano | findstr 27017
