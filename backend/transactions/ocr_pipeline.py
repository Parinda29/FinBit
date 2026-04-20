import re
import difflib
from typing import Dict, List, Optional, Tuple

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None

try:
    import pytesseract
except ImportError:  # pragma: no cover
    pytesseract = None


AMOUNT_REGEX = re.compile(
    r"(?:(?:rs\.?|npr|inr)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)",
    re.IGNORECASE,
)


def preprocess_image(path: str):
    if cv2 is None:
        raise RuntimeError("OpenCV is not installed. Install opencv-python-headless.")

    image = cv2.imread(path)
    if image is None:
        raise ValueError("Could not read receipt image.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    height, width = blurred.shape[:2]
    min_width = 1400
    if width < min_width:
        scale = min_width / max(width, 1)
        resized_width = int(width * scale)
        resized_height = int(height * scale)
        blurred = cv2.resize(blurred, (resized_width, resized_height), interpolation=cv2.INTER_CUBIC)

    thresholded = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        15,
    )

    return thresholded


def extract_text(image) -> str:
    if pytesseract is None:
        raise RuntimeError("pytesseract is not installed.")

    config = "--oem 3 --psm 6"
    raw = pytesseract.image_to_string(image, config=config) or ""

    cleaned_lines = []
    for line in raw.splitlines():
        compact = re.sub(r"\s+", " ", line).strip()
        if compact:
            cleaned_lines.append(compact)
    return "\n".join(cleaned_lines)


def normalize_text(text: str) -> str:
    lowered = (text or "").lower()

    normalized = lowered
    # Fix frequent OCR errors around "total".
    normalized = re.sub(r"\btotai\b", "total", normalized)
    normalized = re.sub(r"\btota1\b", "total", normalized)
    normalized = re.sub(r"\bt0tal\b", "total", normalized)
    normalized = re.sub(r"\btofal\b", "total", normalized)

    # Fix OCR confusion where l is read instead of 1 near separators.
    normalized = normalized.replace("l,", "1,").replace("l.", "1.")

    # Normalize currency markers to one token.
    normalized = re.sub(r"\b(rs\.?|npr|inr)\b", " npr ", normalized)

    # Keep alphanumeric characters, comma, dot, and whitespace for robust parsing.
    normalized_chars = re.sub(r"[^a-z0-9\s\n\.,]", " ", normalized)

    normalized_lines = []
    for line in normalized_chars.splitlines():
        compact = re.sub(r"\s+", " ", line).strip()
        if compact:
            normalized_lines.append(compact)
    return "\n".join(normalized_lines)


def _parse_amount(amount_str: str) -> Optional[float]:
    try:
        amount = float(amount_str.replace(",", ""))
    except ValueError:
        return None

    if amount <= 0:
        return None
    if amount > 100000000:
        return None
    return round(amount, 2)


def _extract_amounts(line: str) -> List[float]:
    values: List[float] = []
    for match in AMOUNT_REGEX.findall(line):
        parsed = _parse_amount(match)
        if parsed is not None:
            values.append(parsed)
    return values


def _line_has_total_keyword(line: str) -> bool:
    strong_patterns = (
        "grand total",
        "final total",
        "total amount",
        "amount total",
        "net total",
        "amount due",
    )
    if any(pattern in line for pattern in strong_patterns):
        return True

    tokens = [token for token in re.split(r"\s+", line) if token]
    if any(token == "total" for token in tokens):
        return True

    # Fuzzy OCR fallback for words close to "total" such as "totai" or "tota1".
    for token in tokens:
        if len(token) < 4:
            continue
        if token in {"totai", "tota1", "tofal", "t0tal"}:
            return True
        if difflib.SequenceMatcher(None, token, "total").ratio() >= 0.8:
            return True
    return False


def _line_has_context_keyword(line: str) -> bool:
    context_tokens = (
        "total",
        "grand total",
        "amount",
        "final total",
        "total amount",
    )
    return any(token in line for token in context_tokens)


def extract_total_amount(text: str) -> Tuple[Optional[float], Dict[str, object]]:
    lines = [line.strip() for line in (text or "").splitlines() if line and line.strip()]
    if not lines:
        return None, {
            "total_lines": [],
            "line_candidates": [],
            "fallback_candidates": [],
            "selected": None,
        }

    ignored_line_keywords = (
        "subtotal",
        "sub total",
        "tax",
        "vat",
        "discount",
        "change",
        "cash",
        "round",
        "qty",
        "quantity",
    )

    total_line_candidates: List[float] = []
    fallback_candidates: List[float] = []
    total_lines: List[str] = []
    line_candidates: List[Dict[str, object]] = []

    for idx, line in enumerate(lines):
        line_amounts = _extract_amounts(line)
        if not line_amounts:
            continue

        fallback_candidates.extend(line_amounts)
        normalized_line = line.lower()
        has_total_signal = _line_has_total_keyword(normalized_line) or _line_has_context_keyword(normalized_line)

        if not has_total_signal:
            prev_line = lines[idx - 1].lower() if idx > 0 else ""
            next_line = lines[idx + 1].lower() if idx + 1 < len(lines) else ""
            has_total_signal = (
                _line_has_total_keyword(prev_line)
                or _line_has_total_keyword(next_line)
                or _line_has_context_keyword(prev_line)
                or _line_has_context_keyword(next_line)
            )

        if not has_total_signal:
            continue

        if any(term in normalized_line for term in ignored_line_keywords) and "grand total" not in normalized_line:
            continue

        total_lines.append(line)
        line_candidates.append({"line": line, "values": line_amounts})
        total_line_candidates.extend(line_amounts)

    if total_line_candidates:
        candidates = [value for value in total_line_candidates if value >= 50]
        candidates = candidates or total_line_candidates
        selected = max(candidates)
        return selected, {
            "total_lines": total_lines,
            "line_candidates": line_candidates,
            "fallback_candidates": [],
            "selected": selected,
        }

    if fallback_candidates:
        candidates = [value for value in fallback_candidates if value >= 50]
        candidates = candidates or fallback_candidates
        selected = max(candidates)
        return selected, {
            "total_lines": [],
            "line_candidates": [],
            "fallback_candidates": candidates,
            "selected": selected,
        }

    return None, {
        "total_lines": [],
        "line_candidates": [],
        "fallback_candidates": [],
        "selected": None,
    }


def process_receipt(image_path: str) -> Dict[str, object]:
    processed_image = preprocess_image(image_path)
    raw_text = extract_text(processed_image)
    normalized_text = normalize_text(raw_text)
    total_amount, debug = extract_total_amount(normalized_text)

    debug_payload = {
        "raw_text_preview": raw_text[:500],
        "total_lines": debug.get("total_lines", []),
        "line_candidates": debug.get("line_candidates", []),
        "fallback_candidates": debug.get("fallback_candidates", []),
        "selected": debug.get("selected"),
    }

    return {
        "amount": total_amount,
        "raw_text": raw_text,
        "normalized_text": normalized_text,
        "debug": debug_payload,
    }
