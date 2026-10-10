
import ipaddress
import re
from urllib.parse import urlparse


SUPPORTED_SCHEMES = {"http", "https"}

SUSPICIOUS_KEYWORDS = re.compile(
    r"login|verify|update|secure|account|password|signin",
    re.IGNORECASE,
)


def extract_url_features(url: str) -> dict:
    """
    Extract explainable features from a URL.

    Raises ValueError for invalid URL input.
    Extracted indicators are not proof of phishing.
    """

    if not isinstance(url, str):
        raise ValueError("URL must be a string.")

    normalized_url = url.strip()

    if not normalized_url:
        raise ValueError("URL cannot be empty.")

    # Reject whitespace inside a URL rather than silently changing it.
    if any(character.isspace() for character in normalized_url):
        raise ValueError("URL cannot contain whitespace.")

    # Add HTTPS when the user omits the scheme.
    if not re.match(
        r"^[a-zA-Z][a-zA-Z0-9+.-]*://",
        normalized_url,
    ):
        normalized_url = "https://" + normalized_url

    try:
        parsed = urlparse(normalized_url)
        hostname = parsed.hostname or ""

        # Accessing .port validates malformed and out-of-range ports.
        port = parsed.port

    except ValueError as error:
        raise ValueError(f"Invalid URL format: {error}") from error

    if parsed.scheme.lower() not in SUPPORTED_SCHEMES:
        raise ValueError("Only HTTP and HTTPS URLs are supported.")

    if not hostname:
        raise ValueError("URL must contain a hostname.")

    if any(character.isspace() for character in hostname):
        raise ValueError("URL hostname is invalid.")

    try:
        ipaddress.ip_address(hostname)
        ip_address_host = True
    except ValueError:
        ip_address_host = False

    path = parsed.path or ""

    return {
        "url_length": len(url),
        "hostname_length": len(hostname),
        "path_length": len(path),
        "dot_count": url.count("."),
        "hyphen_count": url.count("-"),
        "at_symbol_present": "@" in url,
        "ip_address_host": ip_address_host,
        "https_present": parsed.scheme.lower() == "https",
        "suspicious_keyword_present": bool(
            SUSPICIOUS_KEYWORDS.search(url)
        ),
        "url_has_port": port is not None,
    }
