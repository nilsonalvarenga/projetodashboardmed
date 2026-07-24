# Inicia o Dashboard Médico RAG usando o Node portátil em .runtime
$ErrorActionPreference = 'Stop'
$node = Join-Path $PSScriptRoot '.runtime\node-v20.18.1-win-x64'
if (-not (Test-Path (Join-Path $node 'node.exe'))) {
  Write-Host 'Node portátil não encontrado em .runtime. Rode: npm install (com Node 18+).' -ForegroundColor Red
  exit 1
}
$env:Path = "$node;$env:Path"
Set-Location $PSScriptRoot
Write-Host 'Dashboard Médico RAG -> http://localhost:3000  (Ctrl+C para parar)' -ForegroundColor Green
npm run dev
