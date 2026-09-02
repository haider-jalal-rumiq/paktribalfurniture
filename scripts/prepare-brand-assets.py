from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
LOGO_SOURCE = ROOT / "tmp" / "pdfs" / "logos"
PUBLIC_IMAGES = ROOT / "public" / "images"


def extract_logo(source: Path, destination: Path, padding: int = 32) -> Image.Image:
    image = Image.open(source).convert("RGB")
    white = Image.new("RGB", image.size, "white")
    difference = ImageChops.difference(image, white)
    grayscale = difference.convert("L")
    mask = grayscale.point(lambda value: 255 if value > 8 else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f"No visible logo content found in {source}")

    left = max(0, bounds[0] - padding)
    top = max(0, bounds[1] - padding)
    right = min(image.width, bounds[2] + padding)
    bottom = min(image.height, bounds[3] + padding)

    cropped = image.crop((left, top, right, bottom))
    cropped_white = Image.new("RGB", cropped.size, "white")
    alpha = ImageChops.difference(cropped, cropped_white).convert("L")
    alpha = alpha.point(lambda value: 0 if value < 4 else min(255, value * 4))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.3))

    rgba = cropped.convert("RGBA")
    rgba.putalpha(alpha)
    destination.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(destination, optimize=True)
    return rgba


def make_square_icon(source: Image.Image, destination: Path, size: int) -> None:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scaled = source.copy()
    scaled.thumbnail((int(size * 0.82), int(size * 0.82)), Image.Resampling.LANCZOS)
    x = (size - scaled.width) // 2
    y = (size - scaled.height) // 2
    canvas.alpha_composite(scaled, (x, y))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)


def normalize_photos(directory: Path) -> None:
    for path in directory.glob("*.jpg"):
        with Image.open(path) as image:
            image.convert("RGB").save(
                path,
                format="JPEG",
                quality=86,
                optimize=True,
                progressive=True,
            )


def main() -> None:
    horizontal = extract_logo(
        LOGO_SOURCE / "logo-v2.png", PUBLIC_IMAGES / "brand-horizontal.png", padding=20
    )
    mark = extract_logo(
        LOGO_SOURCE / "logo-v3.png", PUBLIC_IMAGES / "brand-mark.png", padding=24
    )
    make_square_icon(mark, ROOT / "src" / "app" / "icon.png", 512)
    make_square_icon(mark, ROOT / "src" / "app" / "apple-icon.png", 180)
    normalize_photos(PUBLIC_IMAGES / "furniture")
    print(
        f"Prepared brand assets: horizontal={horizontal.size}, mark={mark.size}"
    )


if __name__ == "__main__":
    main()
