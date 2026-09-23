#!/usr/bin/env python3
"""
build_tiles.py - turn Scrap Mechanic's isometric tile preview PNGs into flat,
top-down tiles the overview map can use.

The game ships a 220x150 isometric 3D thumbnail per tile at
   ...\\Scrap Mechanic\\Survival\\Terrain\\Tiles\\<biome>\\<uid>.png
on a solid void background. This script finds the diamond, un-rotates it to an
axis-aligned square (a perspective quad -> square warp), and writes <uid>.png
into the map's assets. Flat terrain (water, desert, meadow, field, most forest)
comes out clean; tiles with tall 3D relief (excavation, big mountains) are
approximate since the source is a perspective render, not a true top-down.

Requires: Python 3 + Pillow   (pip install pillow)   -- no other dependencies.

Usage:
   python build_tiles.py --game-tiles "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Scrap Mechanic\\Survival\\Terrain\\Tiles" --out "C:\\path\\to\\html\\assets\\img\\tiles_uid"
"""
import argparse, os, re, sys
from PIL import Image, ImageChops

UUID_PNG = re.compile(r'^[0-9a-fA-F-]{36}\.png$')

def detect_bg(im):
    w, h = im.size
    corners = [im.getpixel((0, 0)), im.getpixel((w-1, 0)),
               im.getpixel((0, h-1)), im.getpixel((w-1, h-1))]
    return max(set(corners), key=corners.count)

def diamond_quad(im):
    bg = detect_bg(im)
    diff = ImageChops.difference(im, Image.new('RGB', im.size, bg)).convert('L')
    mask = diff.point(lambda p: 255 if p > 25 else 0)
    bbox = mask.getbbox()          # (left, top, right, bottom) of the diamond
    if not bbox:
        return None
    l, t, r, b = bbox
    cx, cy = (l + r) // 2, (t + b) // 2
    # the diamond is symmetric, so its tips sit at the bbox edge midpoints.
    # order: top, left, bottom, right -> output square UL, LL, LR, UR (PIL QUAD).
    return [cx, t,  l, cy,  cx, b-1,  r-1, cy]

def rectify(path, size):
    im = Image.open(path).convert('RGB')
    quad = diamond_quad(im)
    if quad is None:
        return None
    # Final map orientation expects a 90-degree clockwise rotation.
    flat = im.transform((size, size), Image.QUAD, quad, resample=Image.BICUBIC)
    return flat.transpose(Image.ROTATE_270)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--game-tiles', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--size', type=int, default=256)
    ap.add_argument('--skip-folders',
                    default="excavation,ravine,underground,bosstrain,ending_cinematic")
    args = ap.parse_args()
    skip = {s.strip().lower() for s in args.skip_folders.split(',') if s.strip()}

    if not os.path.isdir(args.game_tiles):
        sys.exit(f"Game tiles folder not found: {args.game_tiles}")
    os.makedirs(args.out, exist_ok=True)

    n = fail = skipped = 0
    for root, _, files in os.walk(args.game_tiles):
        if os.path.basename(root).lower() in skip:
            skipped += sum(1 for f in files if UUID_PNG.match(f))
            continue
        for f in files:
            if not UUID_PNG.match(f):
                continue
            try:
                sq = rectify(os.path.join(root, f), args.size)
                if sq is None:
                    fail += 1; continue
                sq.save(os.path.join(args.out, f.lower()))
                n += 1
            except Exception as e:
                fail += 1
                print(f"  skip {f}: {e}")

    msg = f"Wrote {n} flat tiles to {args.out}"
    if skipped: msg += f"  ({skipped} relief tiles left as biome colour)"
    if fail:    msg += f"  ({fail} unreadable, skipped)"
    print(msg)

if __name__ == '__main__':
    main()
