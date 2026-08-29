"""Find oak-frame print rectangles in lifestyle mockups and paste the real posters."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

ASSETS = Path(r"C:\Users\angdo\.cursor\projects\c-Users-angdo-ActiveProjects-etsy-typography\assets")
PRINTS = Path(r"C:\Users\angdo\ActiveProjects\Typography\assets\Typography - ZIne Poster")
OUT = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\listing-photos")
QA = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\_qa")

JOBS = [
    {
        "mockup": "01-hero-living-pear.png",
        "out": "01-hero-living.jpg",
        "prints": [PRINTS / "zine-poster__pear__still-sweet-after-the-bruise__3x5.png"],
        "expect": 1,
    },
    {
        "mockup": "02-desk-teacup.png",
        "out": "02-desk-teacup.jpg",
        "prints": [PRINTS / "zine-poster__teacup__the-crack-holds__3x5.png"],
        "expect": 1,
    },
    {
        "mockup": "03-kitchen-fig.png",
        "out": "03-kitchen-fig.jpg",
        "prints": [PRINTS / "zine-poster__fig__opened-too-early__3x5.png"],
        "expect": 1,
    },
    {
        "mockup": "04-hallway-keys.png",
        "out": "04-hallway-keys.jpg",
        "prints": [PRINTS / "zine-poster__keys__the-spare-still-fits__3x5.png"],
        "expect": 1,
    },
    {
        "mockup": "05-gallery-three.png",
        "out": "05-gallery-three.jpg",
        "prints": [
            PRINTS / "zine-poster__pear__still-sweet-after-the-bruise__3x5.png",
            PRINTS / "zine-poster__keys__the-spare-still-fits__3x5.png",
            PRINTS / "zine-poster__envelope__never-sent__3x5.png",
        ],
        "expect": 3,
    },
]


def order_points(pts: np.ndarray) -> np.ndarray:
    pts = np.array(pts, dtype=np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).ravel()
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def find_quads(im: np.ndarray) -> list[np.ndarray]:
    h, w = im.shape[:2]
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 25, 90)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    found: list[tuple[float, np.ndarray]] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 0.035 * w * h or area > 0.75 * w * h:
            continue
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue
        pts = order_points(approx.reshape(4, 2))
        width = np.linalg.norm(pts[1] - pts[0])
        height = np.linalg.norm(pts[3] - pts[0])
        if height < 10 or width / height < 0.45 or width / height > 0.95:
            continue
        found.append((area, pts))
    found.sort(key=lambda row: -row[0])
    uniq: list[np.ndarray] = []
    for _, pts in found:
        center = pts.mean(axis=0)
        if any(np.linalg.norm(center - existing.mean(axis=0)) < 40 for existing in uniq):
            continue
        uniq.append(pts)
    return uniq


def inset_quad(pts: np.ndarray, frac: float = 0.028) -> np.ndarray:
    center = pts.mean(axis=0)
    return pts + (center - pts) * frac


def paste_print(base: np.ndarray, art_path: Path, pts: np.ndarray) -> np.ndarray:
    art = cv2.imread(str(art_path))
    ah, aw = art.shape[:2]
    src = np.array([[0, 0], [aw - 1, 0], [aw - 1, ah - 1], [0, ah - 1]], dtype=np.float32)
    dst = inset_quad(pts)
    matrix = cv2.getPerspectiveTransform(src, dst)
    h, w = base.shape[:2]
    warped = cv2.warpPerspective(art, matrix, (w, h))
    mask = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(mask, dst.astype(np.int32), 255)
    mask = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=1)
    out = base.copy()
    out[mask > 0] = warped[mask > 0]
    return out


def shrink_listing(im: np.ndarray, shortest: int = 2000) -> np.ndarray:
    h, w = im.shape[:2]
    scale = shortest / min(w, h)
    if scale >= 1:
        return im
    return cv2.resize(im, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def main() -> None:
    QA.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        im = cv2.imread(str(ASSETS / job["mockup"]))
        quads = find_quads(im)
        vis = im.copy()
        for i, pts in enumerate(quads):
            cv2.polylines(vis, [pts.astype(np.int32)], True, (0, 0, 255), 4)
            cv2.putText(
                vis,
                str(i),
                tuple(pts.mean(axis=0).astype(int)),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.4,
                (0, 0, 255),
                3,
            )
        cv2.imwrite(str(QA / f"detect-{Path(job['mockup']).stem}.jpg"), vis, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        print(job["mockup"], "quads", len(quads), "expect", job["expect"])
        for i, pts in enumerate(quads[: job["expect"] + 2]):
            print(" ", i, pts.astype(int).tolist())

        if len(quads) < job["expect"]:
            print("  SKIP composite — not enough frames")
            continue

        chosen = quads[: job["expect"]]
        if job["expect"] > 1:
            chosen = sorted(chosen, key=lambda pts: pts[:, 0].mean())

        composed = im
        for art, pts in zip(job["prints"], chosen, strict=True):
            composed = paste_print(composed, art, pts)
        composed = shrink_listing(composed)
        dest = OUT / job["out"]
        cv2.imwrite(str(dest), composed, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        print("  wrote", dest, round(dest.stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()
