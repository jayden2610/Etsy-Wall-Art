"""
Organize the Grok-generated Japandi + Botanical source images into two bundle
roots that mirror the existing Etsy-Typography-Bundle-20 and cocoa/ structure.

Layout per Cocoa:
  output/<bundle>/<ID>/2x3/<ID>_<slug>__2x3.png
  output/<bundle>/<ID>/4x5/<ID>_<slug>__4x5.png
  output/<bundle>/<ID>/5x7/<ID>_<slug>__5x7.png
  output/<bundle>/<ID>/11x14/<ID>_<slug>__11x14.png
  output/<bundle>/<ID>/ISO/<ID>_<slug>__ISO.png
  output/<bundle>/<bundle>-board.png            (contact sheet)

This script copies (not moves) the re-aspected JPGs from
  output/sources/grok-images/<ID>__v1__<ratio>.<ext>
into the two new bundle roots under the Cocoa-style slug naming.

After this runs, the grok-images folder remains as the source-of-truth
master set; the two new folders become the listing-ready bundles.
"""
import os
import shutil
import glob

SRC = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\sources\grok-images"

# Bundle name -> (list of print IDs)
BUNDLES = {
    "japandi":   ["J01", "J02", "J04", "J05", "J06"],
    "botanical": ["B01", "B02", "B03", "B04", "B05", "B06"],
}

# Human slugs (matches the prints-*.json convention)
SLUGS = {
    "J01": "sakura",
    "J02": "koi",
    "J04": "pine",
    "J05": "bamboo",
    "J06": "crescent",
    "B01": "monstera",
    "B02": "olive",
    "B03": "eucalyptus",
    "B04": "fern",
    "B05": "wildflower",
    "B06": "berry",
}

RATIOS = ["2x3", "4x5", "5x7", "11x14", "ISO"]


def main():
    for bundle, ids in BUNDLES.items():
        root = os.path.join(r"C:\Users\angdo\ActiveProjects\etsy-typography\output", bundle)
        os.makedirs(root, exist_ok=True)
        for pid in ids:
            slug = SLUGS[pid]
            for ratio in RATIOS:
                # Find source: <ID>__v1__<ratio>.<ext>
                src_pattern = os.path.join(SRC, f"{pid}_*__{ratio}.*")
                matches = glob.glob(src_pattern)
                if not matches:
                    print(f"  MISSING {pid} {ratio}")
                    continue
                src = matches[0]
                ext = os.path.splitext(src)[1].lower()
                # Cocoa writes PNG; we keep the source ext (jpg / webp) for now
                out_dir = os.path.join(root, pid, ratio)
                os.makedirs(out_dir, exist_ok=True)
                out_name = f"{pid}_{slug}__{ratio}{ext}"
                out_path = os.path.join(out_dir, out_name)
                shutil.copy2(src, out_path)
                print(f"  {bundle}/{pid}/{ratio}/{out_name}")
        print()


if __name__ == "__main__":
    main()
