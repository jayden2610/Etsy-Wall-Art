"""
Restructure the Japandi and Botanical bundles to match the Pocket-Studies
folder shape exactly:

  output/<bundle>/
    2x3/   (12 files: 5 prints + 1 board grid, or 6 + 1)
    4x5/   (same)
    5x7/   (same)
    11x14/ (same)
    ISO/   (same)

Inside each ratio folder:
  <ID>_<slug>__<ratio>.<ext>     (the per-print file, 5 or 6 of them)
  <bundle>_<ratio>__grid.png     (one grid composite for inspection)

This is the same flat-ratio-folder shape as
output/Pocket-Studies-Zine-Posters-11/<ratio>/<ID>_<slug>__<ratio>.jpg

This script:
  1. Clears out the per-print subfolders (J01/4x5/, B04/11x14/, etc.) and the
     mis-placed top-level grid PNGs.
  2. For each ratio, builds <bundle>/<ratio>/ containing the 5 or 6 per-print
     files (copied from the source masters in output/Grok Images) plus the
     ratio grid composite.
  3. Leaves the per-bundle contact board (japandi-board.png, botanical-board.png)
     at the bundle root for cross-set inspection.
"""
import os
import shutil
import glob

SRC = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\Grok Images"
JAPANDI = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\japandi"
BOTANICAL = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\botanical"

BUNDLES = {
    "japandi":   ["J01", "J02", "J04", "J05", "J06"],
    "botanical": ["B01", "B02", "B03", "B04", "B05", "B06"],
}
SLUGS = {
    "J01": "sakura",  "J02": "koi",     "J04": "pine",     "J05": "bamboo",   "J06": "crescent",
    "B01": "eucalyptus","B02": "fern","B03": "berry",   "B04": "monstera", "B05": "olive",     "B06": "wildflower",
}
RATIOS = ["4x5", "5x7", "11x14", "ISO"]  # 2x3 dropped earlier


def find_src(bundle, pid, ratio):
    """Find the Grok source master for this print at this ratio."""
    # Source filename after rename: J01_sakura__v1__3x2__4x5.jpg
    pattern = os.path.join(SRC, f"{pid}_*__{ratio}.*")
    matches = glob.glob(pattern)
    if not matches:
        raise FileNotFoundError(f"No source for {bundle}/{pid}/{ratio}")
    return matches[0]


def reset_bundle(root):
    """Wipe per-print subfolders, ratio folders, and the old top-level grids
    (but keep the per-bundle contact board at the root)."""
    for d in glob.glob(os.path.join(root, "[JB][0-9][0-9]")):
        shutil.rmtree(d)
    for d in glob.glob(os.path.join(root, "[0-9]+x[0-9]+")):
        shutil.rmtree(d)
    for d in glob.glob(os.path.join(root, "ISO")):
        if os.path.isdir(d):
            shutil.rmtree(d)
    for f in glob.glob(os.path.join(root, "*__grid.png")):
        os.remove(f)


def main():
    for bundle, ids in BUNDLES.items():
        root = JAPANDI if bundle == "japandi" else BOTANICAL
        print(f"\n--- {bundle} ---")
        reset_bundle(root)
        for ratio in RATIOS:
            ratio_dir = os.path.join(root, ratio)
            os.makedirs(ratio_dir, exist_ok=True)
            for pid in ids:
                src = find_src(bundle, pid, ratio)
                ext = os.path.splitext(src)[1].lower()
                # Pocket-Studies filename shape: P01_one-good-weight__2x3.jpg
                # We mirror that: J01_sakura__4x5.jpg
                out_name = f"{pid}_{SLUGS[pid]}__{ratio}{ext}"
                shutil.copy2(src, os.path.join(ratio_dir, out_name))
                print(f"  {ratio}/{out_name}")
        print(f"  kept: {bundle}-board.png  (cross-set contact sheet)")

    print("\nDone.")


if __name__ == "__main__":
    main()
