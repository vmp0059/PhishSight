from pathlib import Path

import joblib
import sklearn


# Locate the model relative to this script.
PROJECT_ROOT = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_ROOT / "models" / "phishsight_char_model.joblib"

LABEL_NAMES = {
    0: "Phishing",
    1: "Legitimate",
}


def main() -> None:
    print("PhishSight model verification")
    print("Scikit-learn version:", sklearn.__version__)
    print("Loading model:", MODEL_PATH)

    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    # Load the complete TF-IDF + LinearSVC pipeline.
    model = joblib.load(MODEL_PATH)

    print("Model loaded successfully.")
    print("Model classes:", model.classes_)

    examples = [
        "https://stackoverflow.com/questions/tagged/java",
        "https://en.wikipedia.org/wiki/Machine_learning",
        "http://192.168.1.10/login",
    ]

    print("\nSample predictions:")

    for url in examples:
        # The model was trained on lowercase URL strings.
        normalized_url = url.strip().lower()

        prediction = int(model.predict([normalized_url])[0])
        decision_score = float(
            model.decision_function([normalized_url])[0]
        )

        print(f"\nURL: {url}")
        print("Predicted label:", prediction)
        print("Prediction:", LABEL_NAMES[prediction])
        print("Decision score:", round(decision_score, 4))

    print("\nVerification completed.")


if __name__ == "__main__":
    main()