<#
  embed_cells.ps1 - inline your cells.json into index.html so the map opens
  straight from the file (no web server). Safe to run repeatedly.

  Usage (point it at your map's html folder):
    powershell -ExecutionPolicy Bypass -File .\embed_cells.ps1 -Html "C:\Users\jodesktop\Desktop\sm_overview_setup\sm_overview_setup\html"
#>
param([Parameter(Mandatory)][string]$Html)

$idx  = Join-Path $Html "index.html"
$json = Join-Path $Html "assets\json\cells.json"
foreach ($f in @($idx, $json)) {
    if (-not (Test-Path $f)) { Write-Host "Not found: $f" -ForegroundColor Red; exit 1 }
}

$BT = [char]96
$data = [System.IO.File]::ReadAllText($json)
if ($data.Contains($BT) -or $data.Contains('$' + '{')) {
    Write-Host "cells.json has characters unsafe for inline embedding; use a local web server instead." -ForegroundColor Yellow
    exit 1
}
$html = [System.IO.File]::ReadAllText($idx)
$rx = [regex]"SMOverviewMap\.init\([\s\S]*?\);"
if (-not $rx.IsMatch($html)) {
    Write-Host "Couldn't find the SMOverviewMap.init(...) call in index.html." -ForegroundColor Red; exit 1
}
$call = "SMOverviewMap.init(" + $BT + $data + $BT + ");"
$eval = [System.Text.RegularExpressions.MatchEvaluator]({ param($m) $call }.GetNewClosure())
$html = $rx.Replace($html, $eval, 1)
[System.IO.File]::WriteAllText($idx, $html, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Done - open $idx directly in your browser." -ForegroundColor Green
