"""
Re-aspect the Japandi/Botanical Grok source images from a horizontal 3:2 master
to the 4 other print ratios: 4:5, 5:7, 11:14, ISO (A4/A3/A2 5:7-style).

Source:   output/Grok Images/<ID>__v1__2x3.<ext>  (3:2 horizontal)
Targets:  output/Grok Images/<ID>__v1__<ratio>.<ext>
          - 4x5   = 0.800  (more vertical than master -> crop sides)
          - 5x7   = 0.714  (much more vertical -> crop more sides)
          - 11x14 = 0.786  (more vertical -> crop sides)
          - ISO   = 0.707  (much more vertical -> crop more sides)

Strategy: scale the master UP so its shorter axis matches the target short axis,
then center-crop the long axis to the target aspect. This keeps the off-center
subject roughly where it is (a small shift only) and avoids distortion.

Output resolution: target short axis = 1500px (matches the Cocoa README convention).
A 300-DPI 4x6 print at 4x5" needs 1200px on the short side, so 1500px gives
headroom and matches the 2x3 master (1500x2250 in Cocoa).
"""
import os
import glob
from PIL import Image

SRC_DIR = r"C:\Users\angdo\ActiveProjects\etsy-typography\output\Grok Images"
TARGET_SHORT = 1500  # px, short axis of the output

# Target aspect ratios (width / height)
RATIOS = {
    "4x5":   4 / 5,    # 0.800
    "5x7":   5 / 7,    # 0.714
    "11x14": 11 / 14,  # 0.786
    "ISO":   5 / 7,    # 0.707  (A4/A3/A2 5:7 ratio, same shape as 5x7)
}

# Map: source filename -> output stem (without ratio)
# The script auto-detects: any *.jpg, *.jpeg, *.webp in SRC_DIR is processed.
# New filename = <stem-without-ratio>__v1__<ratio>.<ext>


def re_aspect(src_path: str, target_ratio: float, short_px: int) -> Image.Image:
    """Scale master so short axis = short_px, then center-crop long axis to target_ratio."""
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    src_ratio = w / h

    if src_ratio > target_ratio:
        # Source is wider (more horizontal) than target -> we need to crop the sides.
        # Scale by short axis (height) so height = short_px.
        scale = short_px / h
        new_w = int(round(w * scale))
        new_h = short_px
        im = im.resize((new_w, new_h), Image.LANCZOS)
        # Crop center to target ratio
        target_w = int(round(new_h * target_ratio))
        left = (new_w - target_w) // 2
        im = im.crop((left, 0, left + target_w, new_h))
    else:
        # Source is taller (more vertical) than target -> crop top/bottom.
        scale = short_px / w
        new_w = short_px
        new_h = int(round(h * scale))
        im = im.resize((new_w, new_h), Image.LANCZOS)
        target_h = int(round(new_w / target_ratio))
        top = (new_h - target_h) // 2
        im = im.crop((0, top, new_w, top + target_h))

    return im


def main():
    sources = []
    for ext in ("jpg", "jpeg", "webp", "png"):
        sources.extend(glob.glob(os.path.join(SRC_DIR, f"*.{ext}")))
    sources = sorted(set(sources))

    print(f"Source dir: {SRC_DIR}")
    print(f"Target short axis: {TARGET_SHORT}px")
    print(f"Sources found: {len(sources)}\n")

    for src in sources:
        base = os.path.basename(src)
        # Strip the trailing ratio token (__2x3) so we can append the new one
        # Filename shape: <ID>__v1__<ratio>.<ext>
        stem, ext = os.path.splitext(base)
        # Remove last __<ratio> segment
        parts = stem.rsplit("__", 1)
        if len(parts) == 2 and parts[1] in ("2x3",):
            stem = parts[0]
        else:
            # Fallback: leave as-is, still functional
            stem = stem

        for ratio_name, ratio_val in RATIOS.items():
            out_name = f"{stem}__{ratio_name}{ext.lower()}"
            out_path = os.path.join(SRC_DIR, out_name)
            try:
                out_im = re_aspect(src, ratio_val, TARGET_SHORT)
                out_im.save(out_path, quality=95, optimize=True)
                print(f"  {base:42s} -> {out_name}  ({out_im.size[0]}x{out_im.size[1]})")
            except Exception as e:
                print(f"  {base:42s} -> FAILED  {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
