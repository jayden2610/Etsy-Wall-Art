"""One living-room proof: keep the oak frame, sit the full print in the opening."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PLATE = ROOT / "output" / "_parked" / "anton-listing-photos" / "04-living-room-2000.jpg"
PRINT = ROOT / "output" / "cocoa" / "prints" / "C03" / "2x3" / "C03_this-too-shall-pass__2x3.png"
OUT = ROOT / "output" / "cocoa" / "listing-photos" / "proof-living-room-framed.jpg"

# Paper opening on the 2000x3000 plate — flush to the inner oak lip.
# Sampled at mid-height: wood at x=670, paper at x=680; wood at x=1330.
PAPER = (672, 552, 1330, 1502)


def lighting_from_paper(room: Image.Image, box: tuple[int, int, int, int]) -> np.ndarray:
    """Use the original white sheet as a light map, ignoring black type."""
    x0, y0, x1, y1 = box
    crop = np.array(room.crop(box).convert("L")).astype(np.float32)
    paper = crop > 200
    if paper.sum() < 200:
        paper = crop > 170
    fill = float(np.median(crop[paper])) if paper.any() else 230.0
    lit = np.where(paper, crop, fill)
    blur = Image.fromarray(lit.astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))
    lum = np.array(blur).astype(np.float32)
    shade = np.clip(lum / 236.0, 0.78, 1.08)
    return shade[..., None]


def glass_and_rabbet(w: int, h: int) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[0:h, 0:w]
    nx = xx / max(w - 1, 1)
    ny = yy / max(h - 1, 1)

    # Window is camera-left: a soft diagonal sheen, not a white stripe.
    sheen = np.clip(0.22 - 0.38 * nx - 0.12 * ny, 0, 0.18)
    sheen = sheen * (0.35 + 0.65 * (1 - ny))
    glass = sheen[..., None]

    # Rabbet: the print sits behind the wood, so the rim goes slightly dark.
    edge = np.minimum.reduce([nx, 1 - nx, ny, 1 - ny])
    rim = np.clip((0.045 - edge) / 0.045, 0, 1) ** 1.4
    rabbet = (1 - rim * 0.28)[..., None]
    return glass, rabbet


def fit_full_print(poster: Image.Image, dest_w: int, dest_h: int) -> Image.Image:
    """Cover the paper opening with the whole sheet. No lockup crop."""
    pw, ph = poster.size
    scale = max(dest_w / pw, dest_h / ph)
    fitted = poster.resize(
        (max(1, int(pw * scale)), max(1, int(ph * scale))),
        Image.Resampling.LANCZOS,
    )
    left = (fitted.size[0] - dest_w) // 2
    top = (fitted.size[1] - dest_h) // 2
    return fitted.crop((left, top, left + dest_w, top + dest_h))


def main() -> None:
    room = Image.open(PLATE).convert("RGB")
    poster = Image.open(PRINT).convert("RGB")
    x0, y0, x1, y1 = PAPER
    dest_w, dest_h = x1 - x0, y1 - y0

    field = fit_full_print(poster, dest_w, dest_h)
    field = ImageEnhance.Color(field).enhance(0.92)
    field = ImageEnhance.Brightness(field).enhance(1.04)

    dest = np.array(field).astype(np.float32)
    shade = lighting_from_paper(room, PAPER)
    glass, rabbet = glass_and_rabbet(dest_w, dest_h)

    placed = dest * shade * rabbet
    placed = placed * (1 - glass * 0.55) + 255 * glass * 0.55
    placed = np.clip(placed, 0, 255).astype(np.uint8)

    sheet = Image.fromarray(placed)
    room.paste(sheet, (x0, y0))

    # Any leftover white mat inside the oak gets cocoa — do not paint the wood.
    out = np.array(room)
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    leftover = (r > 190) & (g > 185) & (b > 180)
    leftover[: y0 - 2, :] = False
    leftover[y1 + 2 :, :] = False
    leftover[:, : x0 - 2] = False
    leftover[:, x1 + 2 :] = False
    wood = (np.abs(r.astype(np.int16) - g.astype(np.int16)) > 18) | (b + 25 < r)
    leftover &= ~wood
    cocoa = np.array([53, 36, 24], dtype=np.uint8)
    out[leftover] = cocoa
    room = Image.fromarray(out)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    room.save(OUT, quality=90, optimize=True)
    print(f"ok {OUT} {room.size} paper={PAPER}")


if __name__ == "__main__":
    main()
