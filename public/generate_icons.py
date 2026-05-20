"""
Jalankan script ini dari folder: D:\DCGKN\dashboard2y2\public\
  cd D:\DCGKN\dashboard2y2\public
  python generate_icons.py

Atau jalankan langsung:
  python D:\DCGKN\dashboard2y2\public\generate_icons.py
"""

from PIL import Image
import os
import shutil

SOURCE = "logo-cgkn.png"
script_dir = os.path.dirname(os.path.abspath(__file__))
source_path = os.path.join(script_dir, SOURCE)

icons = [
    ("icon-192x192.png",               192),
    ("icon-512x512.png",               512),
    ("apple-touch-icon.png",           180),
    ("apple-touch-icon-precomposed.png", 180),
    ("apple-touch-icon-120x120.png",   120),
    ("apple-touch-icon-120x120-precomposed.png", 120),
]

def generate():
    if not os.path.exists(source_path):
        print(f"ERROR: File tidak ditemukan -> {source_path}")
        return

    img = Image.open(source_path).convert("RGBA")
    print(f"Source: {source_path} ({img.width}x{img.height})")

    for filename, size in icons:
        out = img.resize((size, size), Image.LANCZOS)
        out_path = os.path.join(script_dir, filename)
        out.save(out_path, "PNG")
        print(f"  ✓ {filename} ({size}x{size})")

    # favicon.ico — multi-size
    favicon_path = os.path.join(script_dir, "favicon.ico")
    sizes = [16, 32, 48]
    frames = [img.resize((s, s), Image.LANCZOS) for s in sizes]
    frames[0].save(favicon_path, format="ICO", sizes=[(s, s) for s in sizes], append_images=frames[1:])
    print(f"  ✓ favicon.ico (16, 32, 48)")

    print("\nSelesai! Semua icon tersimpan di folder public/")

if __name__ == "__main__":
    generate()