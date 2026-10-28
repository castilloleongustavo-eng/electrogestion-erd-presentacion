$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $nodeLocal = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'electrogestion-herramientas') -Directory -Filter 'node-v24*-win-x64' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $nodeLocal) { throw 'Instala Node.js 24.12 o posterior y vuelve a ejecutar este archivo.' }
    $env:PATH = "$($nodeLocal.FullName);$env:PATH"
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible instalar las dependencias.' }
}
& npm.cmd run dev
