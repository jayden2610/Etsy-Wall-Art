"""Crop existing framed listing JPEGs into cover cards. Does not re-sit prints."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
JOBS_PATH = ROOT / "scripts" / "cover-crops.json"
SHORT_SIDE = 2000


def die(message: str, code: int = 1) -> None:
    raise SystemExit(message)


def load_jobs() -> dict:
    return json.loads(JOBS_PATH.read_text(encoding="utf-8"))


def parse_box(text: str) -> tuple[float, float, float, float]:
    parts = [float(p.strip()) for p in text.split(",")]
    if len(parts) != 4:
        die("--crop must be x0,y0,x1,y1 (pixels or 0–1 fractions)")
    return parts[0], parts[1], parts[2], parts[3]


def resolve_box(
    size: tuple[int, int], crop: list[float] | tuple[float, float, float, float]
) -> tuple[int, int, int, int]:
    w, h = size
    x0, y0, x1, y1 = crop
    if max(x0, y0, x1, y1) <= 1.5:
        x0, y0, x1, y1 = x0 * w, y0 * h, x1 * w, y1 * h
    box = (
        max(0, int(round(x0))),
        max(0, int(round(y0))),
        min(w, int(round(x1))),
        min(h, int(round(y1))),
    )
    if box[2] - box[0] < 80 or box[3] - box[1] < 80:
        die(f"crop too small: {box} on {size}")
    return box


def fit_aspect(image: Image.Image, ratio: float) -> Image.Image:
    """Center-crop to width/height = ratio so a 1:1 tile still shows the oak."""
    w, h = image.size
    target_w = w
    target_h = int(round(w / ratio))
    if target_h > h:
        target_h = h
        target_w = int(round(h * ratio))
    left = (w - target_w) // 2
    top = (h - target_h) // 2
    return image.crop((left, top, left + target_w, top + target_h))


def save_hero(image: Image.Image, dest: Path) -> None:
    rgb = fit_aspect(image.convert("RGB"), 4 / 5)
    w, h = rgb.size
    short = min(w, h)
    if short > SHORT_SIDE:
        scale = SHORT_SIDE / short
        rgb = rgb.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb.save(dest, quality=92, optimize=True, subsampling=0)
    print(f"ok {dest.relative_to(ROOT)} {rgb.size}")


def square_center(image: Image.Image) -> Image.Image:
    w, h = image.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return image.crop((left, top, left + side, top + side))


def frame_fill_ratio(image: Image.Image, box: tuple[int, int, int, int]) -> float:
    tile = square_center(image)
    tw, th = tile.size
    x0, y0, x1, y1 = box
    # Map the crop box into the square tile's coordinate space (full image).
    # The tile is the centered square of the cropped hero, so the framed
    # sheet is the whole hero after crop — report that share of the tile.
    return (min(x1, tw) - max(x0, 0)) * (min(y1, th) - max(y0, 0)) / (tw * th)


def apply_listing(job: dict, force: bool, only: str | None) -> Path | None:
    alias = job["alias"]
    if only and alias != only:
        return None
    photos = ROOT / job["photos"]
    hero = job["hero"]
    source = photos / hero["from"]
    dest = photos / hero["out"]
    if not source.exists():
        die(f"{alias}: missing source {source.relative_to(ROOT)}")
    if dest.exists() and dest != source and not force:
        die(f"{alias}: {dest.name} exists. Pass --force to overwrite.")

    snapshot = Image.open(source).convert("RGB")
    crop = hero.get("crop")

    for move in job.get("moves") or []:
        src = photos / move["from"]
        if not src.exists():
            print(f"skip move {alias}: {src.name} missing")
            continue
        if move.get("delete"):
            if src.resolve() == source.resolve() and dest == source:
                continue
            if src.resolve() == dest.resolve():
                continue
            src.unlink()
            print(f"removed {src.relative_to(ROOT)}")
            continue
        target = photos / move["to"]
        if target.exists() and target.resolve() != src.resolve() and not force:
            die(f"{alias}: {target.name} exists. Pass --force.")
        if target.resolve() == src.resolve():
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        src.replace(target)
        print(f"moved {src.name} -> {target.name}")

    if crop:
        box = resolve_box(snapshot.size, crop)
        cropped = snapshot.crop(box)
        fill = frame_fill_ratio(cropped, (0, 0, cropped.size[0], cropped.size[1]))
        print(f"{alias}: 1:1 fill ~{fill:.0%} (frame is the cropped hero)")
        save_hero(cropped, dest)
    else:
        save_hero(snapshot, dest)

    if hero.get("promote") and source.exists() and dest.resolve() != source.resolve():
        source.unlink()
        print(f"promoted away {source.name}")
    return dest


def build_sheet(jobs: list[dict], dest: Path) -> None:
    tiles = []
    labels = []
    for job in jobs:
        path = ROOT / job["photos"] / job["hero"]["out"]
        if not path.exists():
            die(f"sheet: missing {path.relative_to(ROOT)}")
        tiles.append(square_center(Image.open(path).convert("RGB")))
        labels.append(job.get("label") or job["alias"])

    cell = 480
    gap = 16
    cols = 4
    rows = 2
    width = cols * cell + (cols + 1) * gap
    height = rows * (cell + 36) + (rows + 1) * gap + 28
    sheet = Image.new("RGB", (width, height), (247, 243, 236))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 18)
        title_font = ImageFont.truetype("DejaVuSans.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
        title_font = font
    draw.text((gap, 12), "TypographySG · cover cards after cleanup", fill=(53, 36, 24), font=title_font)

    for index, (tile, label) in enumerate(zip(tiles, labels)):
        col, row = index % cols, index // cols
        x = gap + col * (cell + gap)
        y = 44 + gap + row * (cell + 36 + gap)
        fitted = tile.resize((cell, cell), Image.Resampling.LANCZOS)
        sheet.paste(fitted, (x, y))
        draw.text((x, y + cell + 8), label, fill=(53, 36, 24), font=font)

    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, quality=90, optimize=True)
    print(f"ok {dest.relative_to(ROOT)} {sheet.size}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Crop listing photos into cover cards.")
    parser.add_argument("--listing", default="", help="one alias, or all")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--sheet-only", action="store_true")
    parser.add_argument("--crop", default="", help="override x0,y0,x1,y1 for --listing")
    args = parser.parse_args()

    data = load_jobs()
    jobs = data["listings"]
    only = args.listing.lower() or None
    if only and only not in {job["alias"] for job in jobs}:
        die(f"unknown listing {only}")

    if args.crop:
        if not only:
            die("--crop needs --listing")
        box = parse_box(args.crop)
        for job in jobs:
            if job["alias"] == only:
                job["hero"]["crop"] = list(box)

    if not args.sheet_only:
        for job in jobs:
            apply_listing(job, force=args.force, only=only)

    sheet = ROOT / data["sheet"]
    if args.sheet_only or not only:
        build_sheet(jobs, sheet)


if __name__ == "__main__":
    main()
