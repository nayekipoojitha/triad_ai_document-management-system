import io
import os
import logging

logger = logging.getLogger(__name__)

# Configurable Tesseract path for Windows environments if installed in standard paths
TESSERACT_CANDIDATES = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.getenv('TESSERACT_CMD', '')
]

_tesseract_configured = False

def _configure_tesseract():
    global _tesseract_configured
    if _tesseract_configured:
        return
    _tesseract_configured = True
    try:
        import pytesseract
        for candidate in TESSERACT_CANDIDATES:
            if candidate and os.path.exists(candidate):
                pytesseract.pytesseract.tesseract_cmd = candidate
                break
    except Exception:
        pass

def extract_text(data: bytes, filename: str, mimetype: str) -> str:
    """
    Dual-engine extraction:
    1. For PDFs: High-speed native text extraction via PyMuPDF (pymupdf/fitz).
       If native text is empty (scanned PDF), rasterizes pages to images and runs OCR.
    2. For Images (PNG, JPG, TIFF, BMP): Optical Character Recognition via PyTesseract + Pillow.
    Gracefully handles absence of Tesseract binary without throwing.
    """
    _configure_tesseract()
    name = (filename or '').lower()
    extracted_text = []

    # Handle PDF
    if name.endswith('.pdf') or (mimetype and mimetype.lower() == 'application/pdf'):
        try:
            import fitz
            doc = fitz.open(stream=data, filetype='pdf')
            # First attempt: extract native embedded PDF text
            for page in doc:
                text = page.get_text().strip()
                if text:
                    extracted_text.append(text)
            
            combined = "\n".join(extracted_text).strip()
            if combined:
                return combined

            # Second attempt: Scanned PDF -> render pages to images and OCR
            try:
                from PIL import Image
                import pytesseract
                scanned_text = []
                for page in doc:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                    img = Image.open(io.BytesIO(pix.tobytes('png')))
                    ocr_res = pytesseract.image_to_string(img)
                    if ocr_res.strip():
                        scanned_text.append(ocr_res.strip())
                return "\n".join(scanned_text).strip()
            except Exception as e:
                logger.warning(f"Scanned PDF OCR attempt failed or Tesseract binary not present: {e}")
                return ""
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            return ""

    # Handle Images
    image_exts = ('.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.webp')
    if (mimetype and mimetype.lower().startswith('image/')) or name.endswith(image_exts):
        try:
            from PIL import Image
            import pytesseract
            img = Image.open(io.BytesIO(data))
            return pytesseract.image_to_string(img).strip()
        except Exception as e:
            logger.warning(f"Image OCR failed or Tesseract binary not present: {e}")
            return ""

    return ""
