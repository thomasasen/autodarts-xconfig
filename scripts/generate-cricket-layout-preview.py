"""Generate the illustrative Cricket layout card from the source layout geometry."""
import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
geometry = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import {calculateCricketLayout} from './src/features/cricket-layout/logic.js';"
    "import {CRICKET_LAYOUT_PROFILES} from './src/shared/cricket-layout-config.js';"
    "console.log(JSON.stringify(calculateCricketLayout({width:400,height:286,playerCount:4,settings:CRICKET_LAYOUT_PROFILES.multiplayer})));",
], cwd=ROOT, text=True))
image = Image.new("RGB", (640, 360), "#11151e")
draw = ImageDraw.Draw(image)


def font(size):
    path = Path("C:/Windows/Fonts/seguisb.ttf")
    return ImageFont.truetype(str(path), max(9, round(size))) if path.exists() else ImageFont.load_default()


def centered(text, x, y, size, color="#f3f5fa"):
    draw.text((x, y), str(text), font=font(size), fill=color, anchor="mm")


draw.text((14, 9), "CRICKET / TACTICS", font=font(15), fill="#f3f5fa")
draw.text((420, 11), "Beispiel: Mehrspieler", font=font(11), fill="#b8c2d2")
left, top = 14, 48
label_width = geometry["labelWidth"]
column_width = (400 - label_width) / 4
header_height = geometry["headerHeight"]
row_height = geometry["rowHeight"] + geometry["gap"]
for player, name in enumerate(["ANNA", "THOMAS", "BEN", "LENA"]):
    x = left + label_width + player * column_width
    draw.rounded_rectangle((x + 2, top, x + column_width - 2, top + header_height - 2), 4, fill="#242d3b", outline="#eef3fc" if player == 1 else "#3a4556", width=2 if player == 1 else 1)
    centered(name, x + column_width / 2, top + 11, geometry["nameSize"])
    centered([80, 120, 60, 100][player], x + column_width / 2, top + 32, geometry["scoreSize"])
    centered("MPR 2.6", x + column_width / 2, top + header_height - 11, 9, "#b8c2d2")
for row, target in enumerate(["20", "19", "18", "17", "16", "15", "Bull"]):
    y = top + header_height + row * row_height
    draw.rounded_rectangle((left, y, left + label_width - 2, y + row_height - 2), 3, fill="#344052")
    centered(target, left + label_width / 2 - 1, y + row_height / 2 - 1, min(geometry["targetSize"], 19))
    for player in range(4):
        x = left + label_width + player * column_width
        draw.rounded_rectangle((x + 2, y, x + column_width - 2, y + row_height - 2), 3, fill="#202938" if row % 2 == 0 else "#1b2330")
        if player == 1:
            draw.line((x + 2, y + 2, x + 2, y + row_height - 4), fill="#eef3fc", width=2)
        marks = [[3, 2, 1, 0], [1, 3, 2, 1], [0, 1, 3, 2], [2, 1, 0, 3], [1, 0, 1, 0], [0, 1, 0, 0], [0, 0, 1, 0]][row][player]
        cx, cy = x + column_width / 2, y + row_height / 2 - 1
        radius = min(geometry["markSize"] / 2, 11)
        if marks:
            draw.line((cx - radius * .6, cy + radius * .6, cx + radius * .6, cy - radius * .6), fill="#f3f5fa", width=2)
        if marks >= 2:
            draw.line((cx - radius * .6, cy - radius * .6, cx + radius * .6, cy + radius * .6), fill="#f3f5fa", width=2)
        if marks == 3:
            draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline="#f3f5fa", width=2)
cx, cy, radius = 527, 196, 91
draw.ellipse((cx - 104, cy - 104, cx + 104, cy + 104), fill="#090d14")
numbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
for index, number in enumerate(numbers):
    start = -99 + index * 18
    for scale, dark, light in [(1, "#ae3c49", "#33846f"), (.92, "#202731", "#e7dfcd"), (.6, "#ae3c49", "#33846f"), (.52, "#202731", "#e7dfcd")]:
        r = radius * scale
        draw.pieslice((cx - r, cy - r, cx + r, cy + r), start, start + 18, fill=dark if index % 2 == 0 else light)
    angle = math.radians(-90 + index * 18)
    centered(str(number), cx + 99 * math.cos(angle), cy + 99 * math.sin(angle), 9)
draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill="#33846f")
draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill="#ae3c49")
source = ROOT / "docs/screenshots/cricket-layout-example.png"
output = ROOT / "src/assets/xconfig-previews/cricket-layout.webp"
image.save(source)
image.save(output, "WEBP", quality=85, method=6)
print(f"Generated {source.name} and {output.name}")
