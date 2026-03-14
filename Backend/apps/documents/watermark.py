"""
Watermarking service for DMS Phase 2.
Supports PDF and image watermarking with recipient info.
"""

import io
import os
import tempfile
from PIL import Image, ImageDraw, ImageFont
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color


def _get_watermark_text(recipient_name='', recipient_email=''):
    """Generate watermark text from recipient info."""
    parts = []
    if recipient_name:
        parts.append(recipient_name)
    if recipient_email:
        parts.append(recipient_email)
    if not parts:
        parts.append('Shared via SankalpHub')
    return ' | '.join(parts) + ' | CONFIDENTIAL'


def watermark_pdf(file_path, recipient_name='', recipient_email=''):
    """
    Add diagonal watermark text to each page of a PDF.
    Returns path to watermarked temporary file.
    """
    watermark_text = _get_watermark_text(recipient_name, recipient_email)

    # Create watermark PDF overlay
    watermark_buffer = io.BytesIO()
    c = canvas.Canvas(watermark_buffer, pagesize=letter)
    width, height = letter

    c.saveState()
    c.setFillColor(Color(0.5, 0.5, 0.5, alpha=0.15))
    c.setFont('Helvetica', 28)
    c.translate(width / 2, height / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, watermark_text)
    # Add smaller repeated watermarks
    c.setFont('Helvetica', 14)
    for y_offset in [-200, -100, 100, 200]:
        c.drawCentredString(0, y_offset, watermark_text)
    c.restoreState()
    c.save()

    watermark_buffer.seek(0)
    watermark_reader = PdfReader(watermark_buffer)
    watermark_page = watermark_reader.pages[0]

    # Apply watermark to each page
    reader = PdfReader(file_path)
    writer = PdfWriter()

    for page in reader.pages:
        page.merge_page(watermark_page)
        writer.add_page(page)

    # Write to temp file
    fd, output_path = tempfile.mkstemp(suffix='.pdf')
    with os.fdopen(fd, 'wb') as f:
        writer.write(f)

    return output_path


def watermark_image(file_path, recipient_name='', recipient_email=''):
    """
    Add diagonal watermark text overlay to an image.
    Returns path to watermarked temporary file.
    """
    watermark_text = _get_watermark_text(recipient_name, recipient_email)

    img = Image.open(file_path).convert('RGBA')
    overlay = Image.new('RGBA', img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    # Use default font with size based on image dimensions
    font_size = max(16, min(img.width, img.height) // 30)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', font_size)
    except (OSError, IOError):
        font = ImageFont.load_default()

    # Get text dimensions
    bbox = draw.textbbox((0, 0), watermark_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Tile watermark across image
    step_x = text_width + 100
    step_y = text_height + 120

    for y in range(-img.height, img.height * 2, step_y):
        for x in range(-img.width, img.width * 2, step_x):
            # Create rotated text on a temporary image
            txt_img = Image.new('RGBA', (text_width + 20, text_height + 20), (255, 255, 255, 0))
            txt_draw = ImageDraw.Draw(txt_img)
            txt_draw.text((10, 10), watermark_text, font=font, fill=(128, 128, 128, 40))
            rotated = txt_img.rotate(45, expand=True, resample=Image.BICUBIC)
            overlay.paste(rotated, (x, y), rotated)

    watermarked = Image.alpha_composite(img, overlay)

    # Determine output format
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ('.jpg', '.jpeg'):
        output_format = 'JPEG'
        watermarked = watermarked.convert('RGB')
        suffix = '.jpg'
    else:
        output_format = 'PNG'
        suffix = '.png'

    fd, output_path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, 'wb') as f:
        watermarked.save(f, format=output_format, quality=90)

    return output_path


def apply_watermark(file_path, file_type, recipient_name='', recipient_email=''):
    """
    Apply watermark based on file type.
    Returns (watermarked_path, success). If file type not supported, returns (original_path, False).
    """
    file_type = file_type.lower()

    if file_type == 'pdf':
        return watermark_pdf(file_path, recipient_name, recipient_email), True

    if file_type in ('png', 'jpg', 'jpeg', 'gif'):
        return watermark_image(file_path, recipient_name, recipient_email), True

    # Unsupported file type — return original
    return file_path, False
