# Liga o Dev Client ao Metro via USB (adb reverse + deep link).
# Uso: npm run android:connect
#      $env:EXPO_METRO_PORT=8082; npm run android:connect   (se Metro nao estiver na 8081)

$port = if ($env:EXPO_METRO_PORT) { $env:EXPO_METRO_PORT } else { "8081" }
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  Write-Error "adb nao encontrado em $adb"
  exit 1
}

$lines = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\S" }
$phone = $null
foreach ($line in $lines) {
  if ($line -match "^(\S+)\s+device\s") {
    $id = $Matches[1]
    if ($id -notmatch "^emulator-") {
      $phone = $id
      break
    }
  }
}

if (-not $phone) {
  Write-Host ""
  Write-Host "Nenhum telefone em estado 'device'." -ForegroundColor Red
  Write-Host "  - Desbloqueia o Moto e aceita 'Depuracao USB'"
  Write-Host "  - Troca cabo/porta USB se aparecer 'offline'"
  Write-Host ""
  Write-Host "Sem USB: no Dev Client use 'Scan QR' no QR do Metro (Wi-Fi, mesma rede)." -ForegroundColor Yellow
  Write-Host "  Metro nesta maquina: http://192.168.0.7:$port (ajusta IP se mudou)" -ForegroundColor Yellow
  Write-Host ""
  & $adb devices -l
  exit 1
}

Write-Host "Telefone: $phone (Metro porta $port)" -ForegroundColor Green
& $adb -s $phone reverse "tcp:$port" "tcp:$port"
$encoded = [uri]::EscapeDataString("http://127.0.0.1:${port}")
$url = "coachemapp://expo-development-client/?url=$encoded"
& $adb -s $phone shell am start -a android.intent.action.VIEW -d $url
Write-Host "App aberto. Metro tem de estar em: npm run start:dev" -ForegroundColor Cyan
