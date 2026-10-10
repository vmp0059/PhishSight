
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_home_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["project"] == "PHISHSIGHT"
    assert response.json()["status"] == "online"


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is False
    assert data["components"]["url_analyzer"] == "ready"
    assert data["components"]["ml_model"] == "not_loaded"


def test_analyze_valid_url():
    response = client.post(
        "/analyze-url",
        json={"url": "https://example.com/login"},
    )

    assert response.status_code == 200

    data = response.json()
    assert "features" in data
    assert "assessment" in data
    assert "ml_prediction" in data
    assert data["assessment"]["method"] == "heuristic_rules"
    assert data["ml_prediction"]["status"] == "not_available"


def test_analyze_empty_url():
    response = client.post(
        "/analyze-url",
        json={"url": ""},
    )

    assert response.status_code == 400


def test_analyze_invalid_port():
    response = client.post(
        "/analyze-url",
        json={"url": "https://example.com:bad"},
    )

    assert response.status_code == 400


def test_analyze_unsupported_scheme():
    response = client.post(
        "/analyze-url",
        json={"url": "ftp://example.com"},
    )

    assert response.status_code == 400
