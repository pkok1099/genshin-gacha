#!/usr/bin/env python3
"""Generate a 1200x630 Open Graph banner from the current Genshin banner data.

Run at build time (before `vite build`). Composites the featured character
art over a dark gold-gradient backdrop with the character name and banner
meta. Fails soft: if the banner APIs are unreachable, the previous banner
(static/og-banner.png) is kept untouched and the build continues.

Image source order: genshin.jmp.blue gacha splash -> HoYoverse CDN icon.
"""
import io
import json
import math
import os
import sys
import urllib.request

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:
    # Pillow is unavailable on this build image — keep the committed banner.
    print('[og-gen] Pillow not installed — keeping existing banner')
    sys.exit(0)

W, H = 1200, 630
OUT = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static', 'og-banner.png')
)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; GenshinGachaOG/1.0)'}
BANNER_API = 'https://api.ennead.cc/mihoyo/genshin/calendar'

# Colors from the app's palette
BG_TOP = (11, 16, 32)          # #0B1020
BG_BOTTOM = (30, 40, 66)       # slightly lifted
GOLD = (230, 199, 122)         # #E6C77A
GOLD_DIM = (201, 164, 90)      # #C9A45A
CREAM = (242, 230, 208)        # #F2E6D0
GRAY = (142, 151, 170)         # #8E97AA

FONT_DIRS = [
    '/usr/share/fonts/truetype/dejavu',
    '/usr/share/fonts/truetype/liberation',
]
SERIF = os.path.join(FONT_DIRS[0], 'DejaVuSerif-Bold.ttf')
SANS = os.path.join(FONT_DIRS[0], 'DejaVuSans-Bold.ttf')


def fetch(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def load_image(url: str) -> Image.Image:
    return Image.open(io.BytesIO(fetch(url))).convert('RGBA')


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    if not os.path.exists(path):
        # fall back to the other family
        path = SANS if path == SERIF else SERIF
    return ImageFont.truetype(path, size)


def draw_tracked(draw: ImageDraw.ImageDraw, xy, text: str, fnt, fill, tracking: int):
    """Draw text with manual letter-spacing (fonts here have no kerning/tracking)."""
    x, y = xy
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = x - total / 2 if len(text) > 1 else x
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += w + tracking
    return total


def vertical_gradient(size, top, bottom):
    w, h = size
    img = Image.new('RGB', size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=color)
    return img.convert('RGBA')


def radial_glow(size, center, radius, color):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for r in range(radius, 0, -8):
        a = int(70 * (1 - r / radius) ** 2)
        d.ellipse(
            [center[0] - r, center[1] - r, center[0] + r, center[1] + r],
            fill=(*color, a),
        )
    return img.filter(ImageFilter.GaussianBlur(40))


def fit_height(img: Image.Image, target_h: int) -> Image.Image:
    """Scale so the image is target_h tall, cropping width if needed."""
    scale = target_h / img.height
    w = int(img.width * scale)
    img = img.resize((w, target_h), Image.LANCZOS)
    return img


def main() -> int:
    try:
        raw = fetch(BANNER_API)
        data = json.loads(raw)
        banners = data.get('banners') or []
        # First character banner (matches the app's selection logic)
        char_banners = [
            b for b in banners
            if any(c.get('rarity') == 5 for c in (b.get('characters') or []))
        ]
        if not char_banners:
            print('[og-gen] no character banner found — keeping existing banner')
            return 0
        banner = char_banners[0]
        featured = next(c for c in banner['characters'] if c.get('rarity') == 5)
        name = featured['name']
        element = featured.get('element') or ''
        version = banner.get('version') or ''
    except Exception as e:
        print(f'[og-gen] banner API unavailable ({e}) — keeping existing banner')
        return 0

    # ── Candidate images for the featured character ──────────────────────────
    slug_map = {
        'Raiden Shogun': 'raiden', 'Kaedehara Kazuha': 'kazuha',
        'Sangonomiya Kokomi': 'kokomi', 'Kamisato Ayaka': 'ayaka',
        'Kamisato Ayato': 'ayato', 'Shikanoin Heizou': 'shikanoin-heizou',
        'Kuki Shinobu': 'kuki-shinobu', 'Hu Tao': 'hu-tao', 'Yae Miko': 'yae-miko',
        'Arataki Itto': 'arataki-itto', 'Klee': 'klee', 'Wanderer': 'wanderer',
        'Faruzan': 'faruzan', 'Columbina': 'columbina', 'Jahoda': 'jahoda',
        'Ororon': 'ororon', 'Sethos': 'sethos', 'Tighnari': 'tighnari',
    }
    candidates = []
    slug = slug_map.get(name)
    if slug:
        candidates.append(('splash', f'https://genshin.jmp.blue/characters/{slug}/gacha-splash'))
    if featured.get('icon'):
        candidates.append(('icon', featured['icon']))

    art = None
    art_kind = None
    for kind, url in candidates:
        try:
            art = load_image(url)
            art_kind = kind
            print(f'[og-gen] using {art_kind} art for {name}')
            break
        except Exception as e:
            print(f'[og-gen] {kind} failed ({e})')
    if art is None:
        print('[og-gen] no character art available — text-only banner')

    # ── Compose ──────────────────────────────────────────────────────────────
    canvas = vertical_gradient((W, H), BG_TOP, BG_BOTTOM)
    draw = ImageDraw.Draw(canvas, 'RGBA')

    # Warm radial glow behind the art (right side)
    glow = radial_glow((W, H), (900, 315), 460, GOLD)
    canvas = Image.alpha_composite(canvas, glow)
    draw = ImageDraw.Draw(canvas, 'RGBA')

    # Art placement
    art_x0 = 560
    if art is not None and art_kind == 'splash':
        art = fit_height(art, H + 40)
        art = art.crop((0, 0, min(art.width, W - art_x0 + 80), art.height))
        # Soft mask on the left edge of the art for blending
        mask = Image.new('L', art.size, 255)
        md = ImageDraw.Draw(mask)
        fade = 160
        for x in range(fade):
            md.line([(x, 0), (x, art.height)], fill=int(255 * (x / fade)))
        canvas.alpha_composite(art, (W - art.width, -20), mask)
    elif art is not None and art_kind == 'icon':
        # Large rounded-square portrait frame with gold border
        size = 360
        art = art.resize((size, size), Image.LANCZOS)
        frame = Image.new('RGBA', (size + 24, size + 24), (0, 0, 0, 0))
        fd = ImageDraw.Draw(frame)
        fd.rounded_rectangle([0, 0, size + 23, size + 23], radius=28,
                             fill=(26, 35, 55, 255), outline=GOLD_DIM, width=3)
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=18, fill=255)
        frame.paste(art, (12, 12), mask)
        canvas.alpha_composite(frame, (W - size - 96, (H - size - 24) // 2))
        draw = ImageDraw.Draw(canvas, 'RGBA')

    # Dark scrim behind the text for legibility
    scrim = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for x in range(640):
        sd.line([(x, 0), (x, H)], fill=(10, 14, 28, int(160 * (1 - x / 640))))
    canvas = Image.alpha_composite(canvas, scrim)
    draw = ImageDraw.Draw(canvas, 'RGBA')

    # ── Text block (left) ─────────────────────────────────────────────────────
    x0, cx = 56, 400
    y = 150

    # Brand line (gold, tracked)
    draw_tracked(draw, (cx, y), 'G E N S H I N', font(SERIF, 30), GOLD, 6)
    y += 34
    draw_tracked(draw, (cx, y), 'I M P A C T', font(SERIF, 30), GOLD, 6)
    y += 64

    # Gold divider
    draw.line([(x0, y), (x0 + 120, y)], fill=GOLD_DIM, width=3)
    y += 40

    # Character name (big serif, cream) — shrink to fit
    name_size = 64
    fnt_name = font(SERIF, name_size)
    while draw.textlength(name, font=fnt_name) > 430 and name_size > 30:
        name_size -= 4
        fnt_name = font(SERIF, name_size)
    draw.text((cx, y), name, font=fnt_name, fill=CREAM)
    y += name_size + 18

    # Stars
    draw.text((cx, y), '★  ★  ★  ★  ★', font=font(SERIF, 30), fill=GOLD)
    y += 52

    # Meta line (element + version)
    meta = ' '.join(part for part in [element, f'v{version}'] if part)
    draw.text((cx, y), meta.upper(), font=font(SANS, 22), fill=GRAY)
    y += 40

    # Tagline
    draw.text((cx, y), 'Wish Simulator', font=font(SANS, 20), fill=GOLD_DIM)
    y += 34
    draw.text((cx, y), 'Pity · Soft Pity · 50/50', font=font(SANS, 16), fill=GRAY)

    try:
        canvas.convert('RGB').save(OUT, 'PNG')
        print(f'[og-gen] wrote {OUT}')
    except Exception as e:
        print(f'[og-gen] failed to write banner ({e})')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
