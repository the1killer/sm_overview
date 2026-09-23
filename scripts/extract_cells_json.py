#!/usr/bin/env python3
r"""
extract_cells_json.py  -  companion for the1killer/sm_overview (post-0.6.6)

Scrap Mechanic's 0.6.6 update blocked sm.json.save() from writing cells.json to
disk. The working workaround dumps the JSON into the game log instead. This
script pulls that JSON back out of the log and writes a clean cells.json for you,
so you can skip the manual copy / strip-prefix / minify dance.

Usage:
    python extract_cells_json.py                 # auto-find newest SM log
    python extract_cells_json.py path\to\game-XXXX.log
    python extract_cells_json.py --log LOGFILE --out cells.json [--pretty]

If no log is given it looks in the default Steam location:
    C:\Program Files (x86)\Steam\steamapps\common\Scrap Mechanic\Logs
Override with --logs-dir if your Steam library lives elsewhere.
"""
import argparse, glob, json, os, re, sys

START = "--- START COPYING AFTER THIS LINE FOR CELLS.JSON ---"
STOP  = "--- STOP COPYING BEFORE THIS LINE FOR CELLS.JSON ---"

# strips a log prefix like:  21:54:44 (415317/768) [Lua]
# or the two-field form:     15:57:11 (1/3183) [UnnamedThread:33128] [Lua]
PREFIX = re.compile(r'^\s*\d{2}:\d{2}:\d{2}\s+\(\d+/\d+\)\s+(?:\[[\w:.\- ]*\]\s*)+')

DEFAULT_LOGS = r"C:\Program Files (x86)\Steam\steamapps\common\Scrap Mechanic\Logs"

def newest_log(logs_dir):
    files = glob.glob(os.path.join(logs_dir, "game-*.log"))
    if not files:
        return None
    return max(files, key=os.path.getmtime)

def strip_prefix(line):
    return PREFIX.sub("", line).rstrip("\r\n")

def extract(log_path):
    with open(log_path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    # find the LAST start/stop pair (in case a session logged more than once)
    start_idx = stop_idx = None
    for i, ln in enumerate(lines):
        if START in ln:
            start_idx = i
            stop_idx = None
        elif STOP in ln and start_idx is not None:
            stop_idx = i

    if start_idx is None:
        raise SystemExit(
            "No START marker found in the log.\n"
            "Did the save actually load with the modified terrain_overworld.lua?\n"
            "If you see a 'GetLegacyID (a nil value)' error, the tile_database.lua "
            "patch is missing."
        )
    if stop_idx is None or stop_idx <= start_idx:
        raise SystemExit("Found START but no matching STOP marker - the log may be truncated.")

    body = lines[start_idx + 1:stop_idx]
    payload = "".join(strip_prefix(l) for l in body).strip()
    return payload

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("log", nargs="?", help="path to a game-*.log (optional)")
    ap.add_argument("--log", dest="log_opt")
    ap.add_argument("--logs-dir", default=DEFAULT_LOGS)
    ap.add_argument("--out", default="cells.json")
    ap.add_argument("--pretty", action="store_true", help="indent output instead of minifying")
    args = ap.parse_args()

    log_path = args.log or args.log_opt
    if not log_path:
        log_path = newest_log(args.logs_dir)
        if not log_path:
            raise SystemExit(f"No game-*.log found in {args.logs_dir}\nPass the log path explicitly.")
        print(f"Using newest log: {log_path}")

    if not os.path.isfile(log_path):
        raise SystemExit(f"Log file not found: {log_path}")

    payload = extract(log_path)

    try:
        data = json.loads(payload)
    except json.JSONDecodeError as e:
        raise SystemExit(f"Extracted text is not valid JSON: {e}\n"
                         f"First 120 chars:\n{payload[:120]}")

    with open(args.out, "w", encoding="utf-8") as f:
        if args.pretty:
            json.dump(data, f, indent=2)
        else:
            json.dump(data, f, separators=(",", ":"))

    print(f"OK - wrote {len(data)} cells to {args.out} "
          f"({os.path.getsize(args.out):,} bytes)")

if __name__ == "__main__":
    main()
