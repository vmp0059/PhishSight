# PhishSight — Explainable Phishing URL Detection

PhishSight is a machine-learning-assisted phishing URL analysis project built with Python and FastAPI. It combines URL structural analysis, transparent rule-based indicators, and a character-based machine learning classifier to help identify potentially suspicious URLs.

The project is designed to explore phishing detection, explainable indicators, model evaluation, and API integration. Its predictions are experimental and should not be treated as proof that a URL is safe or malicious.

## Features

- **URL feature extraction:** Analyzes URL length, hostname and path structure, HTTPS usage, IP-address hosts, suspicious keywords, and other indicators.
- **Rule-based assessment:** Returns transparent heuristic findings, severity levels, summaries, and limitations.
- **Machine learning:** Uses a character n-gram TF-IDF pipeline with a Linear Support Vector Classifier (LinearSVC).
- **REST API:** Exposes URL analysis and health-check endpoints through FastAPI.
- **API documentation:** Provides interactive documentation through Swagger UI.
- **Automated tests:** Uses pytest to test API and URL-analysis behavior.
- **Separation of concerns:** Keeps URL parsing, heuristic assessment, ML predictions, and API contracts in separate modules.

## Architecture

PhishSight uses three main components when analyzing a URL:

1. **URL analyzer:** Extracts structural features from the supplied URL.
2. **Heuristic assessor:** Applies explicit rules to identify indicators that may warrant further review.
3. **ML predictor:** Uses character-level patterns learned from labelled URLs to predict whether the URL resembles phishing or legitimate examples.

The API returns the heuristic assessment and machine-learning prediction separately. These components are not automatically combined into a single verdict.

## Machine Learning Model

The current experimental model is a **character n-gram TF-IDF + LinearSVC pipeline**.

### How it works

1. The URL is normalized to lowercase.
2. A TF-IDF vectorizer represents character sequences of lengths three to five as numerical features.
3. LinearSVC uses those representations to classify the URL.
4. The API returns the predicted label and the model's decision score.

Character n-grams allow the model to learn recurring URL patterns without relying entirely on manually designed numerical features.

### Label mapping

PhishSight uses the following label convention:

| Label | Meaning |
|---|---|
| `0` | Phishing |
| `1` | Legitimate |

The source dataset, [fed-phishing-urls](https://huggingface.co/datasets/flwrlabs/fed-phishing-urls), uses the reverse convention. Labels were converted during training to match the application.

### Model evaluation

The character model was trained using a balanced sample of 250,000 URL records from the source dataset. A domain-separated development split was used so that URLs from the same registrable domain were not placed in both training and validation.

Observed development results:

| Evaluation | Balanced accuracy | ROC-AUC |
|---|---:|---:|
| Domain-separated validation | 91.60% | 97.34% |
| Source test split — all evaluated URLs | 92.99% | 98.22% |
| Source test split — domains unseen during training | 88.78% | 95.91% |

These are dataset-specific experimental results, not guarantees of real-world performance. The source test split was examined during model development, so it is not an untouched final benchmark. A fresh, representative evaluation set is required for a stronger assessment of generalization.

### Decision scores are not probabilities

LinearSVC produces a decision score, not a calibrated probability. A positive score favours the legitimate class, while a negative score favours the phishing class.

The API does not interpret these scores as percentages or certainty.

## Technology Stack

- **Language:** Python
- **API:** FastAPI
- **Server:** Uvicorn
- **Machine learning:** scikit-learn
- **Text representation:** TF-IDF character n-grams
- **Classifier:** LinearSVC
- **Model persistence:** joblib
- **Validation:** pytest and FastAPI TestClient

## Project Structure

```text
PhishSight/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── ml_predictor.py
│   ├── risk_assessor.py
│   └── url_analyzer.py
├── models/
│   ├── metadata.json
│   └── phishsight_char_model.joblib
├── tests/
│   ├── test_main.py
│   └── test_url_analyzer.py
├── .gitignore
├── requirements.txt
└── README.md
```

The `.joblib` model file is intentionally excluded from ordinary Git commits because of its large size. The metadata file documents the model configuration, evaluation results, and limitations.

## Installation

### Requirements

- Python 3.10 or compatible Python version
- pip
- The trained model artifact for machine-learning predictions

### 1. Clone the repository

```bash
git clone https://github.com/vmp0059/PhishSight.git
cd PhishSight
```

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

The model was trained using scikit-learn 1.6.1. The project pins this version to maintain compatibility with the saved model.

### 4. Obtain the model artifact

The trained `phishsight_char_model.joblib` file is not distributed through the normal Git repository because of its size.

The model must be obtained separately from the project's training output and placed at:

```text
models/phishsight_char_model.joblib
```

The corresponding `models/metadata.json` file should also be present.

A reproducible public model-download mechanism has not yet been configured. Without the model file, the API can retain its URL-analysis and heuristic functionality, but ML predictions will be unavailable.

## Running the API

Start the development server:

```powershell
python -m uvicorn app.main:app --reload
```

The API will be available at:

- **API root:** http://127.0.0.1:8000/
- **Health check:** http://127.0.0.1:8000/health
- **Interactive documentation:** http://127.0.0.1:8000/docs

Keep the server terminal running while testing the API.

## API Endpoints

### `GET /`

Returns basic project information and API status.

### `GET /health`

Reports API health and the loading status of the URL analyzer, heuristic assessor, and machine-learning model.

### `POST /analyze-url`

Accepts a URL for analysis.

Example request:

```json
{
  "url": "https://stackoverflow.com/questions/tagged/java"
}
```

The response contains:

- `url`: the submitted URL.
- `features`: the extracted URL features.
- `assessment`: the rule-based assessment, indicators, severity, summary, and limitations.
- `ml_prediction`: model status, predicted label, prediction name, and decision score when available.

The ML result and rule-based assessment remain separate signals. Neither guarantees that a URL is safe or malicious.

## Running Tests

Execute the automated tests from the project root:

```powershell
python -m pytest -q
```

The tests cover API endpoints, URL validation, analysis behavior, and ML integration.

At the time of the latest integration milestone, all 16 tests passed. Run the test suite again after making changes.

## Limitations and Responsible Use

- PhishSight is an experimental security-analysis project, not a production security guarantee.
- Training labels may be noisy, outdated, or inconsistent with current real-world conditions.
- URL patterns can change, and malicious URLs may resemble legitimate ones.
- Legitimate URLs can contain suspicious-looking features.
- Heuristic indicators and ML predictions can produce false positives and false negatives.
- The SVM decision score is not a calibrated probability.
- Evaluation results on a particular dataset may not generalize to real-world traffic.
- A URL's appearance alone cannot establish whether a website or page is safe.

Use the results as supporting indicators for further investigation, not as the sole basis for security-critical decisions.

## Roadmap

- [x] Implement URL feature extraction.
- [x] Implement transparent heuristic risk assessment.
- [x] Train and evaluate a character-based phishing classifier.
- [x] Integrate ML predictions into FastAPI.
- [x] Add and pass API integration tests.
- [ ] Establish a reproducible model-artifact distribution process.
- [ ] Evaluate on a fresh, independent dataset.
- [ ] Improve calibration and decision-threshold selection.
- [ ] Expand adversarial and malformed-URL testing.
- [ ] Add deeper monitoring and model-version management.

## Development Status

PhishSight is under active development. The current implementation demonstrates URL analysis, heuristic indicators, an experimental ML classifier, and API integration. Further dataset evaluation, reproducibility improvements, and security testing are needed before production use.