import pytest

from app.ml_predictor import is_model_loaded, predict_url


@pytest.mark.skipif(
    not is_model_loaded(),
    reason="ML model is not available",
)
def test_predict_known_legitimate_url():
    result = predict_url(
        "https://stackoverflow.com/questions/tagged/java"
    )

    assert result["predicted_label"] == 1
    assert result["prediction"] == "legitimate"


@pytest.mark.skipif(
    not is_model_loaded(),
    reason="ML model is not available",
)
def test_predict_known_phishing_example():
    result = predict_url("http://192.168.1.10/login")

    assert result["predicted_label"] == 0
    assert result["prediction"] == "phishing"


@pytest.mark.skipif(
    not is_model_loaded(),
    reason="ML model is not available",
)
def test_decision_score_matches_prediction():
    legitimate = predict_url(
        "https://stackoverflow.com/questions/tagged/java"
    )
    phishing = predict_url("http://192.168.1.10/login")

    assert legitimate["decision_score"] > 0
    assert phishing["decision_score"] < 0

    assert "not a probability" in legitimate["score_note"]


@pytest.mark.skipif(
    not is_model_loaded(),
    reason="ML model is not available",
)
@pytest.mark.parametrize("url", ["", "   "])
def test_predict_rejects_empty_url(url):
    with pytest.raises(ValueError, match="non-empty string"):
        predict_url(url)
