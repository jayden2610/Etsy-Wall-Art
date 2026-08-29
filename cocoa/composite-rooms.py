"""Composite cropped Cocoa lockups into room plates. Buyer prints stay D11."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PLATES = ROOT / "output" / "_parked" / "anton-listing-photos"
PRINTS = ROOT / "output" / "cocoa" / "prints"
OUT = ROOT / "output" / "cocoa" / "listing-photos"
OUT.mkdir(parents=True, exist_ok=True)


def print_path(print_id: str) -> Path:
    matches = list((PRINTS / print_id / "2x3").glob(f"{print_id}_*__2x3.png"))
    if not matches:
        raise FileNotFoundError(print_id)
    return matches[0]


def cream_mask(arr: np.ndarray) -> np.ndarray:
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    return (r > 175) & (g > 145) & (b > 110) & (r + 20 > g) & (g + 20 > b)


def crop_lockup(poster: Image.Image, pad_frac_x=0.06, pad_frac_y=0.10) -> Image.Image:
    arr = np.array(poster)
    cream = cream_mask(arr)
    ys, xs = np.where(cream)
    w, h = poster.size
    if ys.size < 80:
        return poster.crop((int(w * 0.12), int(h * 0.28), int(w * 0.88), int(h * 0.72)))
    type_w = int(xs.max() - xs.min())
    type_h = int(ys.max() - ys.min())
    pad_x = max(20, int(type_w * pad_frac_x))
    pad_y = max(24, int(type_h * pad_frac_y))
    x0 = max(0, int(xs.min()) - pad_x)
    y0 = max(0, int(ys.min()) - pad_y)
    x1 = min(w, int(xs.max()) + pad_x)
    y1 = min(h, int(ys.max()) + pad_y)
    return poster.crop((x0, y0, x1, y1))


def line_bands(cream: np.ndarray) -> list[tuple[int, int]]:
    profile = cream.sum(axis=1).astype(np.float32)
    if profile.max() < 20:
        return []
    kernel = np.ones(9, dtype=np.float32) / 9
    smooth = np.convolve(profile, kernel, mode="same")
    thresh = smooth.max() * 0.18
    active = smooth > thresh
    bands = []
    start = None
    for i, hit in enumerate(active):
        if hit and start is None:
            start = i
        elif not hit and start is not None:
            if i - start > 12:
                bands.append((start, i))
            start = None
    if start is not None and len(active) - start > 12:
        bands.append((start, len(active)))
    if len(bands) >= 2:
        return bands
    peaks = []
    for i in range(2, len(smooth) - 2):
        if smooth[i] >= smooth[i - 1] and smooth[i] >= smooth[i + 1] and smooth[i] > thresh * 1.4:
            if not peaks or i - peaks[-1] > 18:
                peaks.append(i)
            elif smooth[i] > smooth[peaks[-1]]:
                peaks[-1] = i
    if len(peaks) < 2:
        return bands
    cuts = [0]
    for a, b in zip(peaks, peaks[1:]):
        valley = int(a + np.argmin(smooth[a:b]))
        cuts.append(valley)
    cuts.append(len(smooth))
    split = []
    for y0, y1 in zip(cuts, cuts[1:]):
        if y1 - y0 > 12:
            split.append((y0, y1))
    return split


def loosen_lockup(poster: Image.Image, gap_frac=0.32) -> Image.Image:
    """Restack D11 lines with extra leading for listing photos only."""
    tight = crop_lockup(poster)
    arr = np.array(tight)
    bands = line_bands(cream_mask(arr))
    if len(bands) < 2:
        return tight
    strips = []
    for y0, y1 in bands:
        pad = max(3, int((y1 - y0) * 0.04))
        sy0 = max(0, y0 - pad)
        sy1 = min(arr.shape[0], y1 + pad)
        strips.append(tight.crop((0, sy0, tight.size[0], sy1)))
    gap = max(16, int(sum(s.size[1] for s in strips) / len(strips) * gap_frac))
    out_h = sum(s.size[1] for s in strips) + gap * (len(strips) - 1)
    out = Image.new("RGB", (tight.size[0], out_h), COCOA)
    y = 0
    for strip in strips:
        out.paste(strip, (0, y))
        y += strip.size[1] + gap
    return out


def white_mask(arr: np.ndarray) -> np.ndarray:
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    bright = (r > 210) & (g > 210) & (b > 210)
    near_white = (np.abs(r.astype(np.int16) - g.astype(np.int16)) < 18) & (
        np.abs(g.astype(np.int16) - b.astype(np.int16)) < 18
    )
    return bright & near_white


def label_components(mask: np.ndarray):
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    current = 0
    for y in range(h):
        row = mask[y]
        for x in range(w):
            if row[x] and labels[y, x] == 0:
                current += 1
                q = deque([(y, x)])
                labels[y, x] = current
                while q:
                    cy, cx = q.popleft()
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and labels[ny, nx] == 0:
                            labels[ny, nx] = current
                            q.append((ny, nx))
    return labels, current


def components(mask: np.ndarray, min_area: int, scale: int):
    small = mask[::scale, ::scale]
    labeled, n = label_components(small)
    boxes = []
    for i in range(1, n + 1):
        ys, xs = np.where(labeled == i)
        if ys.size * scale * scale < min_area:
            continue
        y0, y1 = int(ys.min() * scale), int((ys.max() + 1) * scale)
        x0, x1 = int(xs.min() * scale), int((xs.max() + 1) * scale)
        hh, ww = y1 - y0, x1 - x0
        if hh < 80 or ww < 50:
            continue
        ratio = hh / ww
        if ratio < 1.1 or ratio > 2.6:
            continue
        boxes.append((x0, y0, x1, y1, ys.size))
    boxes.sort(key=lambda b: (b[0], b[1]))
    return boxes


def expand_box(box, img_w, img_h, frac=0.045, extra_left=0):
    x0, y0, x1, y1, _ = box
    pad_x = max(6, int((x1 - x0) * frac))
    pad_y = max(6, int((y1 - y0) * frac))
    return (
        max(0, x0 - pad_x - extra_left),
        max(0, y0 - pad_y),
        min(img_w, x1 + pad_x),
        min(img_h, y1 + pad_y),
    )


COCOA = (53, 36, 24)

# Inner paper of the three oak frames on 00-hero-gallery-three-2000.jpg.
# Left Anton plate is narrower in white-detection because black type punches holes
# in the paper mask — pin the real mat so cocoa covers every white sliver.
HERO_PAPER = [
    (188, 590, 682, 1414),
    (778, 598, 1298, 1408),
    (1330, 598, 1836, 1408),
]


def paste_print(room: Image.Image, poster: Image.Image, box, fill=0.97):
    x0, y0, x1, y1 = box
    dest_w, dest_h = x1 - x0, y1 - y0
    lockup = crop_lockup(poster, pad_frac_x=0.04, pad_frac_y=0.06)
    lw, lh = lockup.size
    scale = min(dest_w / lw, dest_h / lh) * fill
    fitted = lockup.resize((max(1, int(lw * scale)), max(1, int(lh * scale))), Image.Resampling.LANCZOS)
    field = Image.new("RGB", (dest_w, dest_h), COCOA)
    field.paste(fitted, ((dest_w - fitted.size[0]) // 2, (dest_h - fitted.size[1]) // 2))
    dest_arr = np.array(field).astype(np.float32)
    gray = np.array(room.crop((x0, y0, x1, y1)).convert("L"))
    blur = Image.fromarray(gray).filter(ImageFilter.GaussianBlur(40))
    lum = np.array(blur).astype(np.float32)[..., None]
    shade = np.clip((lum / 210.0) * 0.10 + 0.93, 0.90, 1.02)
    blended = np.clip(dest_arr * shade, 0, 255).astype(np.uint8)
    room.paste(Image.fromarray(blended), (x0, y0))
    return room


def composite(plate_name: str, print_ids: list[str], out_name: str):
    room = Image.open(PLATES / plate_name).convert("RGB")
    arr = np.array(room)
    raw = white_mask(arr)
    closed = Image.fromarray((raw * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))
    mask = np.array(closed) > 128
    min_area = int(arr.shape[0] * arr.shape[1] * 0.02)
    boxes = components(mask, min_area, scale=3)
    if len(boxes) < len(print_ids):
        boxes = components(mask, int(arr.shape[0] * arr.shape[1] * 0.003), scale=3)
    img_h, img_w = arr.shape[0], arr.shape[1]
    img_area = img_h * img_w
    posters = []
    for box in boxes:
        x0, y0, x1, y1, area = box
        ww, hh = x1 - x0, y1 - y0
        if y0 > img_h * 0.48:
            continue
        if hh / ww < 1.15 or hh / ww > 2.2:
            continue
        if ww * hh > img_area * 0.22:
            continue
        if ww * hh < img_area * 0.018:
            continue
        posters.append(box)
    posters.sort(key=lambda b: (b[0], b[1]))
    if len(print_ids) == 1:
        cx, cy = img_w / 2, img_h * 0.4
        ranked = sorted(
            boxes,
            key=lambda b: abs((b[0] + b[2]) / 2 - cx) + abs((b[1] + b[3]) / 2 - cy),
        )
        posters = ranked[:1]
    print(f"boxes {plate_name}: raw={len(boxes)} posters={posters}")
    if len(posters) < len(print_ids):
        raise RuntimeError(f"{plate_name}: found {len(posters)} posters, need {len(print_ids)}")
    boxes = posters[: len(print_ids)]
    if plate_name.startswith("00-hero-gallery-three") and len(print_ids) == 3:
        boxes = [(x0, y0, x1, y1, 0) for x0, y0, x1, y1 in HERO_PAPER]
    elif len(boxes) == 3:
        y0 = min(b[1] for b in boxes)
        y1 = max(b[3] for b in boxes)
        max_w = max(b[2] - b[0] for b in boxes)
        aligned = []
        for b in boxes:
            x1 = b[2]
            x0 = max(0, x1 - max_w)
            aligned.append((x0, y0, x1, y1, b[4]))
        boxes = aligned
    for box, pid in zip(boxes, print_ids):
        poster = Image.open(print_path(pid)).convert("RGB")
        if plate_name.startswith("00-hero-gallery-three"):
            box = expand_box(box, img_w, img_h, frac=0.01)
        else:
            box = expand_box(box, img_w, img_h, frac=0.11, extra_left=28)
        room = paste_print(room, poster, box)
    w, h = room.size
    short = min(w, h)
    if short != 2000:
        scale = 2000 / short
        room = room.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    dest = OUT / out_name
    room.save(dest, quality=88, optimize=True)
    print(f"ok {dest.name} {room.size} frames={len(boxes)} {print_ids}")


def build_grid():
    import json

    prints = json.loads((HERE / "prints.json").read_text(encoding="utf-8"))
    cols, rows = 4, 5
    canvas_w, canvas_h = 2400, 3000
    pad = 64
    header_h = 200
    gap_x, gap_y = 36, 28
    caption_h = 72
    cell_w = (canvas_w - pad * 2 - gap_x * (cols - 1)) // cols
    cell_h = (canvas_h - pad - header_h - gap_y * (rows - 1)) // rows
    poster_h = cell_h - caption_h
    cream = (244, 232, 212)
    ink = (53, 36, 24)
    muted = (110, 86, 68)
    bg = Image.new("RGB", (canvas_w, canvas_h), cream)
    draw = ImageDraw.Draw(bg)
    try:
        title_font = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 64)
        sub_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
        id_font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
        line_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
    except OSError:
        title_font = sub_font = id_font = line_font = ImageFont.load_default()

    draw.text((canvas_w // 2, 56), "20 Cocoa Prints", font=title_font, fill=ink, anchor="mt")
    draw.text(
        (canvas_w // 2, 140),
        "ONE ETSY BUNDLE   ·   5 SIZES   ·   DIGITAL DOWNLOAD",
        font=sub_font,
        fill=muted,
        anchor="mt",
    )

    for i, print_row in enumerate(prints):
        col, row = i % cols, i // cols
        x = pad + col * (cell_w + gap_x)
        y = header_h + row * (cell_h + gap_y)
        poster = loosen_lockup(
            Image.open(print_path(print_row["printId"])).convert("RGB"),
            gap_frac=0.20,
        )
        pw, ph = poster.size
        inner_w, inner_h = cell_w - 56, poster_h - 56
        scale = min(inner_w / pw, inner_h / ph) * 0.90
        fitted = poster.resize((int(pw * scale), int(ph * scale)), Image.Resampling.LANCZOS)
        cell = Image.new("RGB", (cell_w, poster_h), COCOA)
        cell.paste(fitted, ((cell_w - fitted.size[0]) // 2, (poster_h - fitted.size[1]) // 2))
        bg.paste(cell, (x, y))
        draw.rectangle((x, y + poster_h, x + cell_w, y + cell_h), fill=cream)
        draw.text(
            (x + cell_w // 2, y + poster_h + 20),
            print_row["printId"],
            font=id_font,
            fill=ink,
            anchor="mt",
        )
        draw.text(
            (x + cell_w // 2, y + poster_h + 46),
            print_row["line"],
            font=line_font,
            fill=muted,
            anchor="mt",
        )

    dest = OUT / "00-bundle-grid.png"
    bg.save(dest, optimize=True)
    print(f"ok {dest.name} {bg.size}")


jobs = [
    ("00-hero-gallery-three-2000.jpg", ["C01", "C04", "C19"], "01-hero-gallery.jpg"),
    ("03-desk-office-2000.jpg", ["C13"], "02-desk-office.jpg"),
    ("04-living-room-2000.jpg", ["C03"], "03-living-room.jpg"),
    ("01-hero-closeup-1percent-2000.jpg", ["C01"], "04-closeup.jpg"),
]

for plate, ids, out in jobs:
    composite(plate, ids, out)
build_grid()
hallway = OUT / "05-hallway.jpg"
if hallway.exists():
    hallway.unlink()
    print("removed 05-hallway.jpg")
