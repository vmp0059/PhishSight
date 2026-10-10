
import pytest

from app.url_analyzer import extract_url_features


def test_https_url():
    features = extract_url_features(
        "https://example.com/login"
    )

    assert features["https_present"] is True
    assert features["hostname_length"] == len("example.com")
    assert features["path_length"] == len("/login")


def test_url_without_scheme():
    features = extract_url_features("example.com/home")

    assert features["https_present"] is True
    assert features["path_length"] == len("/home")


def test_ip_address_host():
    features = extract_url_features(
        "http://192.168.1.10/login"
    )

    assert features["ip_address_host"] is True
    assert features["https_present"] is False


@pytest.mark.parametrize(
    "url",
    [
        "",
        "   ",
        "https://",
        "https://example.com:bad",
        "ftp://example.com",
        "https://example.com:99999",
    ],
)
def test_invalid_urls(url):
    with pytest.raises(ValueError):
        extract_url_features(url)


def test_ipv6_address_host():
    features = extract_url_features(
        "https://[2001:db8::1]/home"
    )

    assert features["ip_address_host"] is True
