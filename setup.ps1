#Requires -Version 5.1
<#
    sm_overview setup  -  guided one-shot installer & runner

    Walks you through generating a Scrap Mechanic overview map:
      1. finds your Scrap Mechanic install and your map (html) folder
      2. backs up the original game scripts
      3. injects the export patch + clears the script cache
      4. you launch the game and load your save
      5. rebuilds cells.json from the log and the tile images from the game files
      6. restores your original game scripts

    Run it with:
      powershell -ExecutionPolicy Bypass -File .\setup.ps1
#>

$ErrorActionPreference = 'Stop'
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }

# ---------- little helpers ----------
function Line   { Write-Host ("-" * 64) -ForegroundColor DarkGray }
function Info($m){ Write-Host $m -ForegroundColor Cyan }
function Good($m){ Write-Host $m -ForegroundColor Green }
function Warn($m){ Write-Host $m -ForegroundColor Yellow }
function Bad($m) { Write-Host $m -ForegroundColor Red }
function Ask($prompt, $default) {
    if ($default) {
        $r = Read-Host "$prompt`n  [$default]"
        if ([string]::IsNullOrWhiteSpace($r)) { return $default }
        return $r.Trim('"').Trim()
    }
    return (Read-Host $prompt).Trim('"').Trim()
}
function YesNo($prompt, $defaultYes = $true) {
    $d = if ($defaultYes) { "Y/n" } else { "y/N" }
    $r = Read-Host "$prompt [$d]"
    if ([string]::IsNullOrWhiteSpace($r)) { return $defaultYes }
    return $r -match '^(y|yes)$'
}
function Invoke-Native {
    # Runs an external command WITHOUT letting text on its error stream become a
    # terminating error (PowerShell 5.1 does that under -ErrorActionPreference Stop).
    # Returns the process exit code.
    param([Parameter(Mandatory)]$Exe, [string[]]$Args, [switch]$Quiet)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($Quiet) { & $Exe @Args 2>&1 | Out-Null }
        else        { & $Exe @Args 2>&1 | ForEach-Object { Write-Host $_ } }
        return $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
}
function Set-InlineJson($indexPath, $jsonPath) {
    # Embed cells.json into index.html's init() call so the map loads over file://
    # ($.getJSON can't read a local file). Idempotent - safe to re-run.
    $BT = [char]96
    $json = [System.IO.File]::ReadAllText($jsonPath)
    if ($json.Contains($BT) -or $json.Contains('$' + '{')) {
        Warn "  cells.json has characters unsafe for inline embedding; use a local web server instead."
        return
    }
    $html = [System.IO.File]::ReadAllText($indexPath)
    $rx = [regex]"SMOverviewMap\.init\([\s\S]*?\);"
    if (-not $rx.IsMatch($html)) {
        Warn "  couldn't find the init() call in index.html; relying on the json file instead."
        return
    }
    $call = "SMOverviewMap.init(" + $BT + $json + $BT + ");"
    $eval = [System.Text.RegularExpressions.MatchEvaluator]({ param($m) $call }.GetNewClosure())
    $html = $rx.Replace($html, $eval, 1)
    [System.IO.File]::WriteAllText($indexPath, $html, (New-Object System.Text.UTF8Encoding($false)))
    Good "  embedded cells.json into index.html (opens directly - no web server needed)"
}

Clear-Host
Line
Info "  sm_overview  -  guided setup"
Line
Write-Host ""

# ---------- 1. locate Scrap Mechanic ----------
function Find-SM {
    $found = @()
    $def = "C:\Program Files (x86)\Steam\steamapps\common\Scrap Mechanic"
    if (Test-Path $def) { $found += $def }
    $vdf = "C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf"
    if (Test-Path $vdf) {
        foreach ($m in (Select-String -Path $vdf -Pattern '"path"\s+"([^"]+)"' -AllMatches).Matches) {
            $lib = $m.Groups[1].Value -replace '\\\\', '\'
            $sm = Join-Path $lib "steamapps\common\Scrap Mechanic"
            if (Test-Path $sm) { $found += $sm }
        }
    }
    return @($found | Select-Object -Unique)
}
function Test-SM($path) {
    return (Test-Path (Join-Path $path "Survival\Scripts\terrain\terrain_overworld.lua")) -and
           (Test-Path (Join-Path $path "Survival\Scripts\terrain\overworld\tile_database.lua"))
}

Info "Looking for Scrap Mechanic..."
$guesses = @(Find-SM)
$SM = $null
if ($guesses.Count -ge 1 -and (Test-SM $guesses[0])) {
    Good "Found Scrap Mechanic at:"
    Write-Host "  $($guesses[0])"
    if (YesNo "Use this install?") {
        $SM = $guesses[0]
    } else {
        $SM = Ask "Enter your Scrap Mechanic install folder (contains 'Survival' and 'Data')"
    }
} else {
    Warn "Couldn't auto-detect it."
    $SM = Ask "Enter your Scrap Mechanic install folder (contains 'Survival' and 'Data')"
}
if (-not (Test-SM $SM)) {
    Bad "That folder doesn't look like a Scrap Mechanic install (missing Survival\Scripts\terrain files)."
    exit 1
}
Good "Using: $SM"
Write-Host ""

# ---------- 2. the map (html) folder is bundled with this package ----------
$Html = Join-Path $Root "html"
if (-not (Test-Path (Join-Path $Html "index.html"))) {
    Bad "Bundled map folder not found at: $Html"
    Bad "Make sure you extracted the whole zip (it includes an 'html' folder next to setup.ps1)."
    exit 1
}
Good "Map folder (bundled): $Html"
Write-Host ""

# ---------- 3. backup location ----------
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$defBackup = Join-Path ([Environment]::GetFolderPath('Desktop')) "sm_overview_backup_$stamp"
$Backup = Ask "Where should I back up your original files?" $defBackup
Write-Host ""

# ---------- summary / confirm ----------
Line
Info "About to:"
Write-Host "  * back up original game scripts to:  $Backup"
Write-Host "  * inject the export patch into:       $SM\Survival\Scripts\terrain"
Write-Host "  * clear Scrap Mechanic's script cache (it rebuilds on next launch)"
Line
if (-not (YesNo "Proceed?")) { Warn "Cancelled - nothing changed."; exit 0 }
Write-Host ""

# ---------- Python (needed to patch, extract, and build tiles) ----------
function Find-Py {
    foreach ($c in @("py", "python", "python3")) {
        try { & $c --version *> $null; if ($LASTEXITCODE -eq 0) { return $c } } catch {}
    }
    return $null
}
$Py = Find-Py
if (-not $Py) {
    Bad "Python 3 is required. Install it from https://www.python.org/downloads/ (tick 'Add to PATH'),"
    Bad "then run this script again."
    exit 1
}
Info "Using Python: $Py"
Write-Host ""

# ---------- 4. back up, then patch the game scripts in place ----------
New-Item -ItemType Directory -Force -Path $Backup | Out-Null
$gameFiles = @(
    "Survival\Scripts\terrain\terrain_overworld.lua",
    "Survival\Scripts\terrain\overworld\tile_database.lua"
)
foreach ($rel in $gameFiles) {
    $bak = Join-Path $Backup ($rel -replace '[\\/]', '__')
    Copy-Item -LiteralPath (Join-Path $SM $rel) -Destination $bak -Force
}
Good "Originals backed up to: $Backup"
$code = Invoke-Native $Py @((Join-Path $Root "scripts\patch_game.py"), "--sm", $SM)
if ($code -ne 0) {
    Bad "Patching failed (message above). Restoring your originals from the backup..."
    foreach ($rel in $gameFiles) {
        $bak = Join-Path $Backup ($rel -replace '[\\/]', '__')
        if (Test-Path $bak) { Copy-Item -LiteralPath $bak -Destination (Join-Path $SM $rel) -Force }
    }
    exit 1
}
Good "Export patch injected."
Write-Host ""

# ---------- 5. clear the script cache ----------
# Info "Clearing script cache (this is what fixes 'the edit didn't take effect')..."
# $cacheRoots = @(
#     $SM,
#     (Join-Path $env:APPDATA  "Axolot Games\Scrap Mechanic"),
#     (Join-Path $env:LOCALAPPDATA "Axolot Games\Scrap Mechanic")
# ) | Where-Object { $_ -and (Test-Path $_) }
# $deleted = 0
# foreach ($cr in $cacheRoots) {
#     Get-ChildItem -Path $cr -Recurse -File -Filter "core_data.cbo" -ErrorAction SilentlyContinue | ForEach-Object {
#         try { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop; $deleted++ } catch {}
#     }
#     Get-ChildItem -Path $cr -Recurse -Directory -Filter "Bundle" -ErrorAction SilentlyContinue | ForEach-Object {
#         try { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop } catch {}
#     }
# }
# if ($deleted -gt 0) { Good "  cleared $deleted cache bundle(s)" } else { Warn "  no cache bundle found (fine - it'll build fresh)" }
# Warn "  Heads up: the next time Scrap Mechanic loads it'll be slower than usual"
# Warn "  while it rebuilds this cache. That's a one-time thing and completely normal."
# Write-Host ""

# ---------- 6. play ----------
Line
Info "Now generate the data in-game:"
Write-Host "  1. Launch Scrap Mechanic"
Write-Host "  2. Load the survival save you want to map"
Write-Host "  3. Let it finish loading (give it a few seconds in-world)"
Write-Host "  4. Quit to desktop"
Line
if (YesNo "Launch Scrap Mechanic for you now?") {
    Start-Process "steam://run/387990//-dev"
    Info "  (launching via Steam...)"
}
Write-Host ""
Read-Host "When you've loaded the save and quit the game, press Enter to continue"
Write-Host ""

# ---------- 8. extract cells.json ----------
$jsonDir = Join-Path $Html "assets\json"
New-Item -ItemType Directory -Force -Path $jsonDir | Out-Null
$cellsOut = Join-Path $jsonDir "cells.json"
Info "Extracting cells.json from the newest game log..."
$code = Invoke-Native $Py @((Join-Path $Root "scripts\extract_cells_json.py"), "--logs-dir", (Join-Path $SM "Logs"), "--out", $cellsOut)
if ($code -ne 0) {
    Bad "Extraction failed. Most likely the save wasn't fully reloaded, so no data reached the log."
    Warn "Re-launch the save, let it load, quit, and run this script again."
    exit 1
}
Good "  wrote $cellsOut"
Info "Embedding the data into index.html for local viewing..."
Set-InlineJson (Join-Path $Html "index.html") $cellsOut
Write-Host ""

# ---------- 9. build tile images ----------
Info "Building tile images from the game files..."
# Pillow is the only Python dependency; install it once, quietly, only if missing.
$havePillow = (Invoke-Native $Py @("-c", "import PIL") -Quiet) -eq 0
if (-not $havePillow) {
    Info "  installing Pillow (one-time)..."
    if ((Invoke-Native $Py @("-m", "pip", "install", "--quiet", "pillow") -Quiet) -ne 0) {
        Invoke-Native $Py @("-m", "pip", "install", "--user", "--quiet", "pillow") -Quiet | Out-Null
    }
}
$tilesOut = Join-Path $Html "assets\img\tiles_uid"
$code = Invoke-Native $Py @((Join-Path $Root "scripts\build_tiles.py"), "--game-tiles", (Join-Path $SM "Survival\Terrain\Tiles"), "--out", $tilesOut)
if ($code -ne 0) { Warn "Tile build reported a problem - the map still works, blank tiles just fall back to colour." }
Write-Host ""

# ---------- 10. restore originals ----------
Line
if (YesNo "Restore your original game scripts now? (recommended)") {
    foreach ($rel in $gameFiles) {
        $bak = Join-Path $Backup ($rel -replace '[\\/]', '__')
        if (Test-Path $bak) { Copy-Item -LiteralPath $bak -Destination (Join-Path $SM $rel) -Force }
    }
    # clear cache again so normal play rebuilds from the restored originals
    foreach ($cr in $cacheRoots) {
        Get-ChildItem -Path $cr -Recurse -Directory -Filter "Bundle" -ErrorAction SilentlyContinue |
            ForEach-Object { try { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop } catch {} }
    }
    Good "  original scripts restored"
    Warn "  (Your next normal game launch will also load slower once, rebuilding the cache.)"
} else {
    Warn "  left the patched scripts in place."
}
Write-Host ""
Line
Good "Done!"
Write-Host ""
Info "Open your map:  $(Join-Path $Html 'index.html')"
Write-Host ""
Warn "Recommended: in Steam, right-click Scrap Mechanic -> Properties -> Installed Files"
Warn "-> Verify integrity of game files. This guarantees your game is back to stock."
Write-Host ""
Info "To update the map later, just run this script again after exploring more."
Line