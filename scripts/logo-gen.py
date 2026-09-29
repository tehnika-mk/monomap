from PIL import Image, ImageDraw

S = 500
SS = 4  # supersample for smooth edges
W = S * SS

ACCENT = (59, 130, 246, 255)

# Site mark ratios (MarketingHeader/favicon, 32px viewBox):
# outer r=8, hole r=4.5  ->  outer r = 125/500, hole = 4.5/8 of outer
OUTER = 125 * SS
INNER = 125 * (4.5 / 8) * SS
C = W / 2

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.ellipse([C - OUTER, C - OUTER, C + OUTER, C + OUTER], fill=ACCENT)
d.ellipse([C - INNER, C - INNER, C + INNER, C + INNER], fill=(0, 0, 0, 0))

img = img.resize((S, S), Image.LANCZOS)
img.save("C:/MegaSync/Projects/Mind Map/static/logo-500.png")
print("saved", img.size, img.mode)
