"""Upscale Pocket Studies zine posters into Etsy print ratios."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps, ImageStat

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC_DIR = Path(r"C:\Users\angdo\ActiveProjects\Typography\assets\Typography - ZIne Poster")
OUT_ROOT = ROOT / "output" / "pocket"
QA_DIR = OUT_ROOT / "_qa"

RATIOS = {
    "2x3": (4500, 6750),
    "4x5": (4500, 5625),
    "5x7": (4500, 6300),
    "11x14": (4500, 5727),
    "ISO": (4500, 6363),
}

PRINTS = [
    {
        "id": "P01",
        "object": "apple",
        "slug": "one-good-weight",
        "line": "one good weight in the hand",
        "file": "zine-poster__apple__one-good-weight__3x5__1200x2000.png",
    },
    {
        "id": "P02",
        "object": "pear",
        "slug": "still-sweet-after-the-bruise",
        "line": "still sweet after the bruise",
        "file": "zine-poster__pear__still-sweet-after-the-bruise__3x5.png",
    },
    {
        "id": "P03",
        "object": "fig",
        "slug": "opened-too-early",
        "line": "opened too early",
        "file": "zine-poster__fig__opened-too-early__3x5.png",
    },
    {
        "id": "P04",
        "object": "teacup",
        "slug": "the-crack-holds",
        "line": "the crack holds",
        "file": "zine-poster__teacup__the-crack-holds__3x5.png",
    },
    {
        "id": "P05",
        "object": "candle",
        "slug": "burned-past-the-mark",
        "line": "burned past the mark",
        "file": "zine-poster__candle__burned-past-the-mark__3x5.png",
    },
    {
        "id": "P06",
        "object": "matchbox",
        "slug": "one-strike-left",
        "line": "one strike left",
        "file": "zine-poster__matchbox__one-strike-left__3x5.png",
    },
    {
        "id": "P07",
        "object": "keys",
        "slug": "the-spare-still-fits",
        "line": "the spare still fits",
        "file": "zine-poster__keys__the-spare-still-fits__3x5.png",
    },
    {
        "id": "P08",
        "object": "button",
        "slug": "from-a-coat-i-sold",
        "line": "from a coat I sold",
        "file": "zine-poster__button__from-a-coat-i-sold__3x5.png",
    },
    {
        "id": "P09",
        "object": "envelope",
        "slug": "never-sent",
        "line": "never sent",
        "file": "zine-poster__envelope__never-sent__3x5.png",
    },
    {
        "id": "P10",
        "object": "stamp",
        "slug": "postmarked-twice",
        "line": "postmarked twice",
        "file": "zine-poster__stamp__postmarked-twice__3x5.png",
    },
    {
        "id": "P11",
        "object": "ticket",
        "slug": "row-k-never-sat",
        "line": "row K never sat",
        "file": "zine-poster__ticket__row-k-never-sat__3x5.png",
    },
]


def median_color(im: Image.Image) -> tuple[int, int, int]:
    stat = ImageStat.Stat(im.convert("RGB"))
    return tuple(int(v) for v in stat.median)


def paper_swatch(im: Image.Image) -> Image.Image:
    """Mid-side paper, away from corner type and the centered object."""
    w, h = im.size
    boxes = [
        (int(w * 0.34), int(h * 0.14), int(w * 0.66), int(h * 0.24)),
        (int(w * 0.06), int(h * 0.38), int(w * 0.18), int(h * 0.62)),
        (int(w * 0.82), int(h * 0.38), int(w * 0.94), int(h * 0.62)),
        (int(w * 0.34), int(h * 0.76), int(w * 0.66), int(h * 0.86)),
    ]
    patches = [im.crop(b).convert("RGB") for b in boxes]
    patches.sort(key=lambda p: ImageStat.Stat(p.convert("L")).stddev[0], reverse=True)
    return patches[0]


def paper_color(im: Image.Image) -> tuple[int, int, int]:
    return median_color(paper_swatch(im))


def upscale(im: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Stepwise Lanczos so a ~4.4x jump does not smear in one hop."""
    work = im.convert("RGB")
    while work.width * 2 < target_w and work.height * 2 < target_h:
        work = work.resize((work.width * 2, work.height * 2), Image.Resampling.LANCZOS)
    return work.resize((target_w, target_h), Image.Resampling.LANCZOS)


def extend_edges(scaled: Image.Image, tw: int, th: int) -> Image.Image:
    """Pad to a new ratio with the same cream. Do not stretch edge pixels into stripes."""
    canvas = Image.new("RGB", (tw, th), paper_color(scaled))
    x = (tw - scaled.width) // 2
    y = (th - scaled.height) // 2
    canvas.paste(scaled, (x, y))
    return canvas


def fit_ratio(src: Image.Image, tw: int, th: int) -> Image.Image:
    scale = min(tw / src.width, th / src.height)
    nw = max(1, round(src.width * scale))
    nh = max(1, round(src.height * scale))
    scaled = upscale(src, nw, nh) if scale > 1.01 else src.resize((nw, nh), Image.Resampling.LANCZOS)
    if nw == tw and nh == th:
        return scaled
    return extend_edges(scaled, tw, th)


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", dpi=(300, 300), compress_level=3)


def save_jpg(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=92, dpi=(300, 300), subsampling=0, optimize=True)


def make_compare(original: Image.Image, print_size: Image.Image, out: Path) -> None:
    left = original.convert("RGB")
    right = print_size.resize(left.size, Image.Resampling.LANCZOS)
    gap = 24
    label_h = 48
    w = left.width * 2 + gap
    h = left.height + label_h
    board = Image.new("RGB", (w, h), (36, 32, 28))
    board.paste(left, (0, label_h))
    board.paste(right, (left.width + gap, label_h))
    draw = ImageDraw.Draw(board)
    draw.text((12, 14), "original", fill=(232, 213, 184))
    draw.text((left.width + gap + 12, 14), "print-size, downscaled to original", fill=(232, 213, 184))
    preview = ImageOps.contain(board, (1600, 2400))
    save_png(preview, out)


def export_print(row: dict, ratios: list[str]) -> list[dict]:
    src_path = SRC_DIR / row["file"]
    src = Image.open(src_path).convert("RGB")
    master = fit_ratio(src, *RATIOS["2x3"])
    preview_dir = OUT_ROOT / "previews"
    save_png(ImageOps.contain(master, (1200, 1800)), preview_dir / f"{row['id']}_{row['slug']}__preview.png")
    results = []
    for ratio in ratios:
        tw, th = RATIOS[ratio]
        fitted = master if ratio == "2x3" else fit_ratio(master, tw, th)
        name = f"{row['id']}_{row['slug']}__{ratio}.jpg"
        dest = OUT_ROOT / ratio / name
        save_jpg(fitted, dest)
        results.append(
            {
                "id": row["id"],
                "ratio": ratio,
                "path": str(dest),
                "px": f"{fitted.width}x{fitted.height}",
                "mb": round(dest.stat().st_size / 1024 / 1024, 2),
            }
        )
        print(f"  {dest}  {fitted.width}x{fitted.height}  {results[-1]['mb']} MB")
    src.close()
    return results


def run_qa(print_id: str) -> None:
    row = next(p for p in PRINTS if p["id"] == print_id)
    src = Image.open(SRC_DIR / row["file"])
    QA_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC_DIR / row["file"], QA_DIR / f"{row['id']}_original.png")

    two_by_three = fit_ratio(src, *RATIOS["2x3"])
    four_by_five = fit_ratio(src, *RATIOS["4x5"])
    path_23 = QA_DIR / f"{row['id']}__2x3.png"
    path_45 = QA_DIR / f"{row['id']}__4x5.png"
    save_png(two_by_three, path_23)
    save_png(four_by_five, path_45)
    save_png(ImageOps.contain(two_by_three, (900, 1350)), QA_DIR / f"{row['id']}__2x3-preview.png")
    save_png(ImageOps.contain(four_by_five, (900, 1125)), QA_DIR / f"{row['id']}__4x5-preview.png")
    make_compare(src, two_by_three, QA_DIR / f"{row['id']}__compare.png")

    print(json.dumps(
        {
            "id": row["id"],
            "source": f"{src.width}x{src.height}",
            "2x3": f"{two_by_three.width}x{two_by_three.height} {round(path_23.stat().st_size / 1024 / 1024, 2)}MB",
            "4x5": f"{four_by_five.width}x{four_by_five.height} {round(path_45.stat().st_size / 1024 / 1024, 2)}MB",
        },
        indent=2,
    ))
    src.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--qa", metavar="ID", help="Build one print for visual check (e.g. P02)")
    parser.add_argument("--print", dest="one", metavar="ID")
    args = parser.parse_args()

    if args.qa:
        run_qa(args.qa)
        return

    rows = PRINTS if not args.one else [p for p in PRINTS if p["id"] == args.one]
    if not rows:
        sys.exit(f"Unknown print {args.one}")
    all_results = []
    for row in rows:
        print(row["id"], row["line"])
        all_results.extend(export_print(row, list(RATIOS)))
    (OUT_ROOT / "manifest.json").write_text(json.dumps(all_results, indent=2), encoding="utf-8")
    print(f"\n{len(all_results)} files")


if __name__ == "__main__":
    main()
