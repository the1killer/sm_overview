#!/usr/bin/env python3
"""
patch_game.py - inject (or remove) the sm_overview export code in a Scrap
Mechanic install, in place, so it works regardless of the game version.

Unlike copying pre-patched files over the game's, this edits whatever the
current game scripts are, using stable anchors, and is idempotent. Run --unpatch
to cleanly remove the changes (or just restore from your backup).

  python patch_game.py --sm "C:\\...\\Scrap Mechanic"
  python patch_game.py --sm "C:\\...\\Scrap Mechanic" --unpatch
"""
import argparse, os, re, sys

TERRAIN_REL = os.path.join("Survival", "Scripts", "terrain", "terrain_overworld.lua")
TILEDB_REL  = os.path.join("Survival", "Scripts", "terrain", "overworld", "tile_database.lua")

DUMP_BEGIN = "-- ===== sm_overview cell dump ====="
DUMP_END   = "-- ===== end sm_overview cell dump ====="

# body lines at relative indent (tabs); indented to match the game file on insert
DUMP_BODY = """{BEGIN}
if not g_smOverviewDumped then
\tg_smOverviewDumped = true
\tlocal cells = {{}}
\tfor cellY = g_cellData.bounds.yMin, g_cellData.bounds.yMax do
\t\tfor cellX = g_cellData.bounds.xMin, g_cellData.bounds.xMax do
\t\t\tlocal uid = GetCellTileUid( cellX, cellY )
\t\t\tlocal cell = {{}}
\t\t\tcell["x"] = cellX
\t\t\tcell["y"] = cellY
\t\t\tcell["tileid"] = GetLegacyID and GetLegacyID( uid ) or nil
\t\t\tcell["uid"] = tostring( uid )
\t\t\tcell["flags"] = g_cellData.flags[cellY][cellX]
\t\t\tcell["rotation"] = g_cellData.rotation[cellY][cellX]
\t\t\tcells[#cells+1] = cell
\t\tend
\tend
\tif #cells > 0 then
\t\tcells[1]["bounds"] = g_cellData.bounds
\t\tcells[1]["seed"] = g_cellData.seed
\t\tif not GetLegacyID then
\t\t\tsm.log.warning( "sm_overview: GetLegacyID missing - tile_database.lua not patched; tileids will be nil" )
\t\tend
\t\tsm.log.info( "--- START COPYING AFTER THIS LINE FOR CELLS.JSON ---" )
\t\tsm.log.info( sm.json.writeJsonString( cells ) )
\t\tsm.log.info( "--- STOP COPYING BEFORE THIS LINE FOR CELLS.JSON ---" )
\t\tcells = nil
\tend
end
{END}""".format(BEGIN=DUMP_BEGIN, END=DUMP_END)

def read(p):
    with open(p, "rb") as f:
        raw = f.read()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8")
    if crlf:
        text = text.replace("\r\n", "\n")   # normalise to \n for editing
    return text, crlf

def write(p, s, crlf):
    if crlf:
        s = s.replace("\n", "\r\n")          # restore original style on save
    with open(p, "wb") as f:
        f.write(s.encode("utf-8"))

# ---------------- terrain_overworld.lua ----------------
def patch_terrain(src):
    if DUMP_BEGIN in src:
        return src, "already patched"
    # insert immediately before the first `return true` inside Load()
    m = re.search(r"function\s+Load\s*\(\s*\).*?\n([ \t]*)return true\b", src, re.S)
    if not m:
        return src, "ERROR: couldn't find 'function Load() ... return true' anchor"
    indent = m.group(1)
    block = "\n".join(indent + ln if ln else ln for ln in DUMP_BODY.split("\n"))
    ins_at = m.start(1)
    new = src[:ins_at] + block + "\n" + src[ins_at:]
    return new, "patched"

def unpatch_terrain(src):
    if DUMP_BEGIN not in src:
        return src, "not patched"
    new = re.sub(r"[ \t]*" + re.escape(DUMP_BEGIN) + r".*?" + re.escape(DUMP_END) + r"\n?",
                 "", src, flags=re.S)
    return new, "removed"

# ---------------- tile_database.lua ----------------
def patch_tiledb(src):
    changed = []
    if "function AddTile( legacyId" not in src:
        # not fatal: without legacy ids, the map falls back to game tile images by uid
        changed.append("WARN: AddTile signature changed - tileids may be nil (map still works via uid tiles)")
    if "local legacyIds" not in src:
        a = "local f_legacyIdUpgradeList = {}"
        if a not in src:
            return src, "ERROR: anchor 'local f_legacyIdUpgradeList = {}' not found"
        src = src.replace(a, a + "\nlocal legacyIds = {} -- sm_overview: reverse map tostring(uid) -> legacyId", 1)
        changed.append("legacyIds table")
    if "legacyIds[tostring( uid )] = legacyId" not in src:
        a = "AddLegacyUpgrade( legacyId, uid )"
        if a in src:
            src = src.replace(a, a + "\n\t\tlegacyIds[tostring( uid )] = legacyId -- sm_overview", 1)
            changed.append("AddTile reverse-map")
    if "function GetLegacyID" not in src:
        src = src + ("\n\n"
            "-- sm_overview: reverse lookup uid -> legacy integer id (nil if none)\n"
            "function GetLegacyID( uid )\n\treturn legacyIds[tostring( uid )]\nend")
        changed.append("GetLegacyID")
    return src, ("patched: " + ", ".join(changed) if changed else "already patched")

def unpatch_tiledb(src):
    src = re.sub(r"\n[ \t]*local legacyIds = \{\} -- sm_overview.*", "", src)
    src = re.sub(r"\n[ \t]*legacyIds\[tostring\( uid \)\] = legacyId -- sm_overview", "", src)
    src = re.sub(r"\n+-- sm_overview: reverse lookup.*?\nfunction GetLegacyID\( uid \).*?\nend",
                 "", src, flags=re.S)
    return src, "removed"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sm", required=True, help="Scrap Mechanic install folder")
    ap.add_argument("--unpatch", action="store_true")
    args = ap.parse_args()

    terrain = os.path.join(args.sm, TERRAIN_REL)
    tiledb  = os.path.join(args.sm, TILEDB_REL)
    for f in (terrain, tiledb):
        if not os.path.isfile(f):
            sys.exit(f"Not found: {f}\nIs --sm the right Scrap Mechanic folder?")

    if args.unpatch:
        txt, crlf = read(terrain); s, r1 = unpatch_terrain(txt); write(terrain, s, crlf)
        print(f"terrain_overworld.lua: {r1}")
        txt, crlf = read(tiledb);  s, r2 = unpatch_tiledb(txt);  write(tiledb, s, crlf)
        print(f"tile_database.lua: {r2}")
        return

    txt, crlf = read(terrain); s, r1 = patch_terrain(txt)
    if r1.startswith("ERROR"): sys.exit(f"terrain_overworld.lua: {r1}")
    write(terrain, s, crlf); print(f"terrain_overworld.lua: {r1}")

    txt, crlf = read(tiledb); s, r2 = patch_tiledb(txt)
    if r2.startswith("ERROR"): sys.exit(f"tile_database.lua: {r2}")
    write(tiledb, s, crlf); print(f"tile_database.lua: {r2}")

if __name__ == "__main__":
    main()
