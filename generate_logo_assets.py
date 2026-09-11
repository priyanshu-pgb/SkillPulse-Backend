import os
import shutil
from PIL import Image, ImageDraw, ImageFilter

src_path = r'C:\Users\priya\.gemini\antigravity-ide\brain\281b65db-aa22-43ec-91f3-2ca47beca192\skillpulse_logo_1789114510073.jpg'
dest_dirs = [
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\SkillPulse-Frontend\images',
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\SkillPulse-Frontend\assets',
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\static\images',
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\staticfiles\images'
]

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)

img = Image.open(src_path).convert('RGBA')

# 1. Save high-res master PNG & JPG
img_rgb = img.convert('RGB')
for d in dest_dirs:
    img.save(os.path.join(d, 'skillpulse-logo.png'), 'PNG')
    img_rgb.save(os.path.join(d, 'skillpulse-logo.jpg'), 'JPEG', quality=95)

# 2. Create squircle / rounded app icon version with subtle glow border
def create_app_icon(base_img, size=512, radius=110):
    resized = base_img.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=255)
    
    app_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    app_icon.paste(resized, (0, 0), mask=mask)
    
    # Add subtle border
    border_draw = ImageDraw.Draw(app_icon)
    border_draw.rounded_rectangle([(1, 1), (size-2, size-2)], radius=radius, outline=(255, 255, 255, 40), width=max(1, size // 128))
    return app_icon

app_icon_512 = create_app_icon(img, size=512, radius=110)
app_icon_180 = create_app_icon(img, size=180, radius=40)
app_icon_64 = create_app_icon(img, size=64, radius=14)
app_icon_32 = create_app_icon(img, size=32, radius=7)
app_icon_16 = create_app_icon(img, size=16, radius=4)

for d in dest_dirs:
    app_icon_512.save(os.path.join(d, 'skillpulse-app-icon.png'), 'PNG')
    app_icon_180.save(os.path.join(d, 'apple-touch-icon.png'), 'PNG')
    app_icon_64.save(os.path.join(d, 'skillpulse-icon-64.png'), 'PNG')
    app_icon_32.save(os.path.join(d, 'favicon-32x32.png'), 'PNG')
    app_icon_16.save(os.path.join(d, 'favicon-16x16.png'), 'PNG')

# Save apple-touch-icon and favicon.ico in SkillPulse-Frontend root as well
fe_root = r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\SkillPulse-Frontend'
app_icon_180.save(os.path.join(fe_root, 'apple-touch-icon.png'), 'PNG')
app_icon_32.save(os.path.join(fe_root, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48)])
if os.path.exists(r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\static'):
    app_icon_32.save(r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\static\favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48)])

# 3. Create transparent cut-out emblem using pure PIL
bg_r, bg_g, bg_b = 8, 28, 48
def calc_alpha(pixel):
    r, g, b, a = pixel
    dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)**0.5
    if dist <= 26:
        return (r, g, b, 0)
    elif dist >= 68:
        return (r, g, b, 255)
    else:
        new_a = int(((dist - 26) / (68 - 26)) * 255)
        return (r, g, b, min(255, max(0, new_a)))

transparent_img = Image.new('RGBA', img.size)
pixels = [calc_alpha(p) for p in img.getdata()]
transparent_img.putdata(pixels)

for d in dest_dirs:
    transparent_img.save(os.path.join(d, 'skillpulse-icon-transparent.png'), 'PNG')

print("Successfully generated all logo assets with PIL!")
