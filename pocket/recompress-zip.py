"""Build an Etsy-sized zip of Pocket Studies JPEGs without touching the masters."""
from pathlib import Path
import shutil
import subprocess

from PIL import Image

SRC = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket")
STAGING = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\_zip-staging")
ZIP_PATH = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\Pocket-Studies-Zine-Posters-11.zip")
RATIOS = ["2x3", "4x5", "5x7", "11x14", "ISO"]
QUALITY = 28

if STAGING.exists():
    shutil.rmtree(STAGING)
STAGING.mkdir(parents=True)

count = 0
for ratio in RATIOS:
    dest = STAGING / ratio
    dest.mkdir()
    for src in sorted((SRC / ratio).glob("*.jpg")):
        im = Image.open(src).convert("RGB")
        dpi = im.info.get("dpi", (300, 300))
        im.save(dest / src.name, quality=QUALITY, optimize=True, progressive=True, dpi=dpi)
        count += 1
        print(src.name, dest.joinpath(src.name).stat().st_size)

if ZIP_PATH.exists():
    ZIP_PATH.unlink()
subprocess.run(
    ["tar", "-a", "-cf", str(ZIP_PATH), *RATIOS],
    cwd=STAGING,
    check=True,
)
print(f"ok {count} files zip={ZIP_PATH.stat().st_size / 1024 / 1024:.2f} MB")
