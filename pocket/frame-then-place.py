"""Seat Pocket Studies prints in a real oak frame, then hang them on empty room photos."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ASSETS = Path(r"C:\Users\angdo\.cursor\projects\c-Users-angdo-ActiveProjects-etsy-typography\assets")
PRINTS = Path(r"C:\Users\angdo\ActiveProjects\Typography\assets\Typography - ZIne Poster")
OUT = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\listing-photos")
FRAMED_DIR = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\_framed")
QA = Path(r"C:\Users\angdo\ActiveProjects\etsy-typography\output\pocket\_qa")

FRAME_PHOTO = ASSETS / "empty-thin-oak-gallery-frame.png"
WOOD = ASSETS / "oak-wood-grain.png"

PEAR = PRINTS / "zine-poster__pear__still-sweet-after-the-bruise__3x5.png"
KEYS = PRINTS / "zine-poster__keys__the-spare-still-fits__3x5.png"
TEACUP = PRINTS / "zine-poster__teacup__the-crack-holds__3x5.png"
ENVELOPE = PRINTS / "zine-poster__envelope__never-sent__3x5.png"


def order_points(pts: np.ndarray) -> np.ndarray:
    pts = np.array(pts, dtype=np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).ravel()
    return np.array(
        [pts[np.argmin(s)], pts[np.argmin(diff)], pts[np.argmax(s)], pts[np.argmax(diff)]],
        dtype=np.float32,
    )


def oak_mask(bgr: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    return cv2.inRange(hsv, (6, 18, 55), (40, 210, 250))


def inner_opening(bgr: np.ndarray) -> np.ndarray | None:
    mask = oak_mask(bgr)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        return None
    holes: list[tuple[float, np.ndarray]] = []
    for i, contour in enumerate(contours):
        parent = hierarchy[0][i][3]
        if parent < 0:
            continue
        area = cv2.contourArea(contour)
        if area < 8000:
            continue
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        if len(approx) == 4:
            holes.append((area, order_points(approx.reshape(4, 2))))
        else:
            x, y, w, h = cv2.boundingRect(contour)
            holes.append((area, order_points(np.array([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]))))
    if not holes:
        return None
    holes.sort(key=lambda row: -row[0])
    return holes[0][1]


def outer_quad(bgr: np.ndarray) -> np.ndarray | None:
    mask = oak_mask(bgr)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    contour = max(contours, key=cv2.contourArea)
    peri = cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, 0.015 * peri, True)
    if len(approx) >= 4:
        rect = cv2.minAreaRect(contour)
        return order_points(cv2.boxPoints(rect))
    x, y, w, h = cv2.boundingRect(contour)
    return order_points(np.array([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]))


def black_opening(bgr: np.ndarray) -> np.ndarray | None:
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    _, dark = cv2.threshold(gray, 48, 255, cv2.THRESH_BINARY_INV)
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    contours, _ = cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = gray.shape
    best = None
    best_area = 0
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 0.15 * w * h or area > 0.85 * w * h:
            continue
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        if len(approx) == 4:
            pts = order_points(approx.reshape(4, 2))
        else:
            x, y, bw, bh = cv2.boundingRect(contour)
            pts = order_points(np.array([[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]))
        cx, cy = pts.mean(axis=0)
        if abs(cx - w / 2) > w * 0.2 or abs(cy - h / 2) > h * 0.2:
            continue
        if area > best_area:
            best_area = area
            best = pts
    return best


def rabbet_shadow(seated: np.ndarray, quad: np.ndarray) -> np.ndarray:
    """Darken the print under the inner lip so the oak sits in front of the paper."""
    h, w = seated.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(mask, np.round(quad).astype(np.int32), 255)
    inner = cv2.erode(mask, np.ones((15, 15), np.uint8))
    ring = cv2.subtract(mask, inner)
    yy, xx = np.indices((h, w))
    cx, cy = quad.mean(axis=0)
    # light from upper-left: stronger shade on the top and left of the opening
    bias = np.clip(1.15 - 0.0009 * ((xx - cx) + (yy - cy)), 0.62, 1.0)
    out = seated.astype(np.float32)
    shade = ring > 0
    for c in range(3):
        channel = out[:, :, c]
        channel[shade] *= bias[shade]
        out[:, :, c] = channel
    return np.clip(out, 0, 255).astype(np.uint8)


def cutout_from_empty(empty_bgr: np.ndarray, seated_bgr: np.ndarray, quad: np.ndarray) -> Image.Image:
    oak = oak_mask(empty_bgr)
    oak = cv2.morphologyEx(oak, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    hole = np.zeros(oak.shape, np.uint8)
    cv2.fillConvexPoly(hole, np.round(quad).astype(np.int32), 255)
    keep = cv2.bitwise_or(oak, hole)
    keep = cv2.erode(keep, np.ones((3, 3), np.uint8))
    keep = cv2.GaussianBlur(keep, (3, 3), 0)
    rgba = cv2.cvtColor(seated_bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = keep
    im = Image.fromarray(rgba)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    return im


def framed_from_photo(art_path: Path) -> Image.Image | None:
    frame = cv2.imread(str(FRAME_PHOTO))
    opening = black_opening(frame)
    if opening is None:
        opening = inner_opening(frame)
    if opening is None:
        return None
    width = np.linalg.norm(opening[1] - opening[0])
    height = np.linalg.norm(opening[3] - opening[0])
    aspect = float(width / height) if height else 0
    print(f"  photo-frame opening {width:.0f}x{height:.0f} aspect {aspect:.3f}")
    art = cv2.imread(str(art_path))
    seated = warp_print_into_quad(frame, art, opening)
    seated = rabbet_shadow(seated, opening)
    return cutout_from_empty(frame, seated, opening)


def warp_print_into_quad(frame_bgr: np.ndarray, art_bgr: np.ndarray, quad: np.ndarray) -> np.ndarray:
    h, w = art_bgr.shape[:2]
    src = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(src, quad)
    fh, fw = frame_bgr.shape[:2]
    warped = cv2.warpPerspective(art_bgr, matrix, (fw, fh), flags=cv2.INTER_CUBIC)
    mask = np.zeros((fh, fw), np.uint8)
    cv2.fillConvexPoly(mask, np.round(quad).astype(np.int32), 255)
    out = frame_bgr.copy()
    out[mask > 0] = warped[mask > 0]
    return out


def cutout_frame(bgr: np.ndarray) -> Image.Image:
    mask = oak_mask(bgr)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    hole = inner_opening(bgr)
    if hole is not None:
        cv2.fillConvexPoly(mask, np.round(hole).astype(np.int32), 255)
    mask = cv2.GaussianBlur(mask, (5, 5), 0)
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = mask
    return Image.fromarray(rgba)


def tile_wood(size: tuple[int, int]) -> Image.Image:
    wood = Image.open(WOOD).convert("RGB")
    canvas = Image.new("RGB", size)
    for y in range(0, size[1], wood.height):
        for x in range(0, size[0], wood.width):
            canvas.paste(wood, (x, y))
    return canvas


def built_frame(art_path: Path, print_w: int = 1400) -> Image.Image:
    """Thin 2:3 oak frame so the poster fills the opening with no float gap."""
    art = Image.open(art_path).convert("RGB")
    print_h = int(print_w * 1.5)
    art = ImageOps.fit(art, (print_w, print_h), Image.Resampling.LANCZOS)
    moulding = max(40, print_w // 18)
    outer_w = print_w + moulding * 2
    outer_h = print_h + moulding * 2
    frame = tile_wood((outer_w, outer_h))
    art_rgba = art.convert("RGBA")
    glint = Image.new("RGBA", art.size, (255, 255, 255, 0))
    gdraw = ImageDraw.Draw(glint)
    gdraw.ellipse(
        (-int(print_w * 0.25), -int(print_h * 0.28), int(print_w * 0.62), int(print_h * 0.38)),
        fill=(255, 255, 255, 22),
    )
    glint = glint.filter(ImageFilter.GaussianBlur(18))
    art = Image.alpha_composite(art_rgba, glint).convert("RGB")
    frame.paste(art, (moulding, moulding))
    draw = ImageDraw.Draw(frame, "RGBA")
    # inner rabbet
    draw.rectangle(
        [moulding - 2, moulding - 2, moulding + print_w + 1, moulding + print_h + 1],
        outline=(42, 28, 16, 140),
        width=3,
    )
    draw.rectangle(
        [moulding, moulding, moulding + print_w - 1, moulding + print_h - 1],
        outline=(20, 14, 10, 70),
        width=1,
    )
    # outer edge — keep it dark so the oak does not glow against the wall
    draw.rectangle([0, 0, outer_w - 1, outer_h - 1], outline=(78, 52, 30, 160), width=2)
    draw.rectangle([1, 1, outer_w - 2, outer_h - 2], outline=(120, 86, 52, 70), width=1)
    # mitre ticks
    draw.line([(0, 0), (moulding, moulding)], fill=(70, 48, 28, 120), width=2)
    draw.line([(outer_w, 0), (outer_w - moulding, moulding)], fill=(70, 48, 28, 120), width=2)
    draw.line([(0, outer_h), (moulding, outer_h - moulding)], fill=(70, 48, 28, 120), width=2)
    draw.line([(outer_w, outer_h), (outer_w - moulding, outer_h - moulding)], fill=(70, 48, 28, 120), width=2)
    rgba = frame.convert("RGBA")
    return rgba


def framed_from_photo(art_path: Path) -> Image.Image | None:
    frame = cv2.imread(str(FRAME_PHOTO))
    opening = inner_opening(frame)
    if opening is None:
        return None
    width = np.linalg.norm(opening[1] - opening[0])
    height = np.linalg.norm(opening[3] - opening[0])
    aspect = float(width / height) if height else 0
    print(f"  photo-frame opening {width:.0f}x{height:.0f} aspect {aspect:.3f}")
    if abs(aspect - (2 / 3)) > 0.08:
        return None
    art = cv2.imread(str(art_path))
    seated = warp_print_into_quad(frame, art, opening)
    return cutout_frame(seated)


def add_shadow(piece: Image.Image, blur: int = 7, offset: tuple[int, int] = (4, 8)) -> Image.Image:
    ox, oy = offset
    pad = blur * 2
    canvas = Image.new("RGBA", (piece.width + ox + pad, piece.height + oy + pad), (0, 0, 0, 0))
    shade = piece.getchannel("A").point(lambda a: 70 if a > 8 else 0)
    black = Image.new("RGBA", piece.size, (0, 0, 0, 0))
    black.putalpha(shade)
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow.paste(black, (pad // 2 + ox, pad // 2 + oy), black)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(piece, (pad // 2, pad // 2), piece)
    return canvas


def apply_room_light(empty: Image.Image, composed: Image.Image) -> Image.Image:
    """Multiply the empty wall's light (window bars, plant dapple) onto the hung frame."""
    empty_np = np.asarray(empty.convert("RGB"), dtype=np.float32)
    comp_np = np.asarray(composed.convert("RGB"), dtype=np.float32)
    empty_l = empty_np[:, :, 0] * 0.299 + empty_np[:, :, 1] * 0.587 + empty_np[:, :, 2] * 0.114
    diff = np.abs(comp_np - empty_np).sum(axis=2)
    mask = diff > 16
    if not mask.any():
        return composed.convert("RGB")
    wall = empty_l[empty_l > 90]
    base = float(np.median(wall)) if wall.size else 180.0
    ratio = np.clip(empty_l / (base + 1e-3), 0.52, 1.18)
    for c in range(3):
        channel = comp_np[:, :, c]
        channel[mask] = np.clip(channel[mask] * ratio[mask], 0, 255)
        comp_np[:, :, c] = channel
    return Image.fromarray(comp_np.astype(np.uint8))


def place_on_room(
    room: Image.Image,
    framed: Image.Image,
    center: tuple[float, float],
    width_frac: float,
) -> Image.Image:
    empty = room.convert("RGB")
    base = empty.convert("RGBA")
    target_w = max(80, int(base.width * width_frac))
    scale = target_w / framed.width
    piece = framed.resize((target_w, int(framed.height * scale)), Image.Resampling.LANCZOS)
    x = int(base.width * center[0] - piece.width / 2)
    y = int(base.height * center[1] - piece.height / 2)
    out = base.copy()
    out.paste(piece, (x, y), piece)
    return apply_room_light(empty, out)


def save_listing(im: Image.Image, name: str) -> Path:
    shortest = min(im.size)
    if shortest < 2000:
        scale = 2000 / shortest
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    dest = OUT / name
    im.save(dest, "JPEG", quality=88, optimize=True)
    print("  wrote", dest, im.size, round(dest.stat().st_size / 1024), "KB")
    return dest


def make_framed(art_path: Path, stem: str) -> Image.Image:
    FRAMED_DIR.mkdir(parents=True, exist_ok=True)
    photo = framed_from_photo(art_path)
    if photo is None:
        raise RuntimeError(f"Could not seat {stem} in the photographed oak frame")
    photo.save(FRAMED_DIR / f"{stem}-photo.png")
    gray = Image.new("RGB", (photo.width + 96, photo.height + 96), (210, 206, 200))
    gray.paste(photo, (48, 48), photo)
    gray.save(FRAMED_DIR / f"{stem}-preview.jpg", quality=90)
    print(f"  {stem}: seated in photographed thin oak gallery frame")
    return photo


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)

    frame_bgr = cv2.imread(str(FRAME_PHOTO))
    opening = black_opening(frame_bgr)
    if opening is None:
        opening = inner_opening(frame_bgr)
    vis = frame_bgr.copy()
    if opening is not None:
        cv2.polylines(vis, [np.round(opening).astype(np.int32)], True, (0, 0, 255), 4)
        w = np.linalg.norm(opening[1] - opening[0])
        h = np.linalg.norm(opening[3] - opening[0])
        print("opening", w, h, "aspect", w / h)
    cv2.imwrite(str(QA / "frame-opening.jpg"), vis)

    pear = make_framed(PEAR, "pear")
    keys = make_framed(KEYS, "keys")
    teacup = make_framed(TEACUP, "teacup")
    envelope = make_framed(ENVELOPE, "envelope")

    living = Image.open(ASSETS / "room-empty-living.png")
    desk = Image.open(ASSETS / "room-empty-desk.png")
    gallery = Image.open(ASSETS / "room-empty-gallery.png")

    hero = place_on_room(living, pear, (0.50, 0.34), 0.22)
    save_listing(hero, "01-hero-living.jpg")

    desk_shot = place_on_room(desk, teacup, (0.50, 0.36), 0.42)
    save_listing(desk_shot, "02-desk-teacup.jpg")

    gallery_rgb = gallery.convert("RGB")
    for framed, cx in ((pear, 0.32), (keys, 0.50), (envelope, 0.68)):
        gallery_rgb = place_on_room(gallery_rgb, framed, (cx, 0.36), 0.145)
    save_listing(gallery_rgb, "05-gallery-three.jpg")


if __name__ == "__main__":
    main()
