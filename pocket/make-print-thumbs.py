"""Make 2000px listing thumbs of the 11 Pocket Studies prints."""
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\2x3")
OUT = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\listing-photos")
PRINTS = [
    "P01_one-good-weight__2x3.jpg",
    "P02_still-sweet-after-the-bruise__2x3.jpg",
    "P03_opened-too-early__2x3.jpg",
    "P04_the-crack-holds__2x3.jpg",
    "P05_burned-past-the-mark__2x3.jpg",
    "P06_one-strike-left__2x3.jpg",
    "P07_the-spare-still-fits__2x3.jpg",
    "P08_from-a-coat-i-sold__2x3.jpg",
    "P09_never-sent__2x3.jpg",
    "P10_postmarked-twice__2x3.jpg",
    "P11_row-k-never-sat__2x3.jpg",
]

for i, name in enumerate(PRINTS, start=1):
    im = Image.open(SRC / name).convert("RGB")
    w, h = im.size
    scale = 2000 / min(w, h)
    im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    dest = OUT / f"print-{i:02d}-{name.replace('__2x3', '')}"
    im.save(dest, quality=88, optimize=True)
    print(dest.name, im.size, dest.stat().st_size)
