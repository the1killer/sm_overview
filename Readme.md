# sm_overview (updated)

Generate a top-down overview map of your Scrap Mechanic survival world and view
it in the browser (leafletJS).

This is an updated, maintained take on **[the1killer/sm_overview]** — the original
stopped working after Scrap Mechanic's 0.6.6 update, and the game has changed a
few times since. It keeps the same idea and file format, but the export and the
tile imagery both work differently now (see *What's different* below). All credit
for the original tool and the map front-end goes to the1killer.

## What's different from the original

- **Works on current Scrap Mechanic.** 0.6.6 sandboxed `sm.json.save`, so writing
  `cells.json` straight to disk stopped working. The cell data is now emitted to
  the game log and rebuilt into `cells.json` afterwards.
- **Version-safe patching.** Instead of copying pre-patched Lua files over yours
  (which breaks whenever the game updates), it injects the small export block into
  *your* current game scripts using stable anchors, and can cleanly remove it.
- **Every tile has an image.** The original showed newer tiles as blank. This
  sources a preview image for every tile from the game's own files, flattens the
  isometric thumbnails into top-down tiles, and keys them by tile UUID — so new
  tiles fill in, and it keeps working across updates. Tiles with no image fall
  back to a flat biome colour.
- **One guided installer** (`setup.ps1`) that does the whole flow, plus automatic
  embedding of the JSON so the map opens straight from `index.html`.

## Requirements

- Scrap Mechanic (installed via Steam)
- Windows PowerShell (built into Windows)
- Python 3 — https://www.python.org/downloads/ (tick **Add to PATH**)

## Quick start

From this folder, in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

It will:

1. find your Scrap Mechanic install (confirm with y/n),
2. back up your original game scripts,
3. patch in the export code
4. wait while you launch the game, load your save, and quit,
5. rebuild `cells.json`, flatten the tile images, and embed the data, then
6. restore your original game scripts.

Open `html/index.html` when it's done. Re-run any time after exploring more.

## How it works

`patch_game.py` injects a small block into `terrain_overworld.lua` (inside
`Load()`) that walks the loaded cells and prints them as JSON between two markers
in the game log, plus three small additions to `tile_database.lua` so each cell
can report a legacy tile id. `extract_cells_json.py` pulls that JSON back out of
the newest log and writes `cells.json`. `build_tiles.py` reads the game's tile
preview PNGs (`Survival/Terrain/Tiles/<biome>/<uid>.png`), un-rotates each
isometric diamond into a flat top-down square, and writes them to
`html/assets/img/tiles_uid/` keyed by UUID. The map (`sm_overview_map.js`) uses
the original screenshots where they exist and falls back to the UUID tile,
then to a flat biome colour.

## Notes

- **Game updates overwrite the patched scripts.** Re-run `setup.ps1` afterwards.
  You can also restore stock scripts any time via Steam -> right-click Scrap
  Mechanic -> Properties -> Installed Files -> *Verify integrity of game files*.
- **Deep 3D tiles** (excavation, ravine, underground, boss train, cinematic)
  don't flatten cleanly from a perspective thumbnail, so they're left as flat
  biome colour by default. Pass `--skip-folders ""` to `build_tiles.py` to
  convert them anyway.
- **Terrain height** isn't really represented (same as the original).
- **First load is slower.** Clearing the script cache (needed so the game picks
  up the patch) means Scrap Mechanic rebuilds it on the next launch, so that one
  load takes longer than usual. This happens once after patching and once more
  after the originals are restored - both normal.
- **Local vs hosted:** `setup.ps1` embeds the JSON into `index.html` so it opens
  over `file://`. If you host `html/` on a real web server instead, use the
  pristine `index.html` (the `$.getJSON` fetch of `assets/json/cells.json` works
  there).

## Manual patching / removal

You don't need this if you use `setup.ps1`, but the pieces are usable on their own:

```powershell
# patch (in place, idempotent):
py scripts\patch_game.py --sm "C:\Program Files (x86)\Steam\steamapps\common\Scrap Mechanic"
# remove the patch cleanly:
py scripts\patch_game.py --sm "C:\...\Scrap Mechanic" --unpatch
```

## Credits & license

Original **sm_overview** by **the1killer** — https://github.com/the1killer/sm_overview
Tutorial video by LionHeartBlue Gaming (linked from the original repo).

Licensed under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0**
(CC BY-NC-SA 4.0), the same license as the original. See `LICENSE`.

Scrap Mechanic is property of Axolot Games AB; no affiliation.

[the1killer/sm_overview]: https://github.com/the1killer/sm_overview