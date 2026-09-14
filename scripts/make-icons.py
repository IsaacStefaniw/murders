"""
Generate every app icon from one definition.

Apple rejected 1.0 under guideline 2.3.8 — "the app icons appear to be
placeholder icons" — and they were exactly right. Every file under
assets/images was dated to the afternoon the project was scaffolded, and
`ios.icon` pointed at an Icon Composer bundle containing `expo-symbol.svg`:
the Expo logo, on Apple's default system blue. Not a rough first pass at an
IntentNorth icon. Another company's mark, shipped twice.

So the icons live here as code rather than as binaries nobody can edit.
Regenerate with:  python3 scripts/make-icons.py

── The mark ────────────────────────────────────────────────────────────

A compass needle, north half light. It is drawn rather than lettered
because Apple's guidance is against text in an icon, and it is a needle
rather than a chevron or an arrow so that it can never again be mistaken
for the Expo mark it replaces.

Colours are the app's own tokens from src/constants/theme.ts — sage
#3E6B58 is already the accent on every screen and in the splash, so the
icon and the first frame of the app agree.

Sizes are deliberately conservative: the mark holds at 40 points, which is
the Spotlight size and the smallest anybody meets it at.
"""

from PIL import Image, ImageDraw

SS = 4                       # supersample, then downsample for clean edges
S = 1024 * SS

SAGE = (62, 107, 88)         # theme accent
SAGE_DEEP = (40, 72, 59)     # the gradient's foot
SAGE_LIGHT = (143, 184, 165) # theme dark-mode accent — the needle's south half
CREAM = (247, 245, 241)      # theme background — the needle's north half

OUT = 'assets/images'


def ground(top, bottom, size=S):
    """A quiet vertical gradient. A flat fill reads as unfinished at size."""
    img = Image.new('RGB', (size, size), top)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)],
               fill=tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return img


def needle(d, cx, cy, half_h, half_w, north, south):
    """Two triangles meeting at the waist. No pivot dot — at 40 points it
    is noise, and the two tones already say which end is north."""
    d.polygon([(cx, cy - half_h), (cx + half_w, cy), (cx, cy), (cx - half_w, cy)], fill=north)
    d.polygon([(cx, cy + half_h), (cx + half_w, cy), (cx, cy), (cx - half_w, cy)], fill=south)


def save(img, name, px=1024):
    img.resize((px, px), Image.LANCZOS).save(f'{OUT}/{name}')
    print(f'  {name}  {px}x{px}')


def mark_on_transparent(half_h, half_w, north, south, size=S):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    needle(ImageDraw.Draw(img), size / 2, size / 2, size * half_h, size * half_w, north, south)
    return img


print('icons:')

# The app icon. 0.385 half-height fills the square without crowding the
# corner radius iOS masks it with.
img = ground(SAGE, SAGE_DEEP)
needle(ImageDraw.Draw(img), S / 2, S / 2, S * 0.385, S * 0.145, CREAM, SAGE_LIGHT)
save(img, 'icon.png')

# The splash. expo-splash-screen already paints #3E6B58 behind it, so the
# mark is transparent and the two agree by construction.
save(mark_on_transparent(0.385, 0.145, CREAM, SAGE_LIGHT), 'splash-icon.png', 512)

# Android adaptive. The foreground must sit inside the central 66% — the
# launcher may mask anything outside it — so the mark is scaled down rather
# than cropped.
save(mark_on_transparent(0.30, 0.113, CREAM, SAGE_LIGHT), 'android-icon-foreground.png')
save(ground(SAGE, SAGE_DEEP), 'android-icon-background.png')
save(mark_on_transparent(0.30, 0.113, (255, 255, 255), (255, 255, 255)),
     'android-icon-monochrome.png')

# Web.
img = ground(SAGE, SAGE_DEEP)
needle(ImageDraw.Draw(img), S / 2, S / 2, S * 0.385, S * 0.145, CREAM, SAGE_LIGHT)
save(img, 'favicon.png', 196)
