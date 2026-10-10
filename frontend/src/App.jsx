import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/analyze-url";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleScan(event) {
    event.preventDefault();

    const targetUrl = url.trim();

    if (!targetUrl) {
      setError("Please enter a URL to scan.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : data.detail
              ? JSON.stringify(data.detail)
              : `Request failed with status ${response.status}`;

        throw new Error(detail);
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the PhishSight API."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleUrlChange(event) {
    setUrl(event.target.value);
    setResult(null);
    setError("");
  }

  const prediction = result?.ml_prediction;
  const assessment = result?.assessment;
  const features = result?.features ?? {};
  const indicators = assessment?.indicators ?? [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">P</div>
          <div>
            <h2>PhishSight</h2>
            <p>THREAT INTELLIGENCE</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <div className="nav-item active">
          <span className="nav-symbol">⌕</span>
          <span>URL Scanner</span>
        </div>

        <div className="nav-item">
          <span className="nav-symbol">◈</span>
          <span>Threat Analysis</span>
        </div>

        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span>Local environment</span>
          <small>DEV</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">WORKSPACE /</span>
            <span className="breadcrumb-current"> URL SCANNER</span>
          </div>

          <div className="system-status">
            <span className="status-dot" />
            System initialized
          </div>
        </header>

        <section className="welcome">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            EXPLAINABLE SECURITY
          </div>

          <h1>
            See beyond the <span>URL.</span>
          </h1>

          <p>
            Analyze suspicious links with machine learning and transparent
            security indicators.
          </p>
        </section>

        <section className="scanner-card">
          <div className="card-heading">
            <div className="heading-icon">↗</div>

            <div>
              <h3>URL intelligence scanner</h3>
              <p>Enter a URL to begin your security analysis.</p>
            </div>

            <span className="version-tag">ML ENGINE</span>
          </div>

          <form onSubmit={handleScan}>
            <label htmlFor="url-input">TARGET URL</label>

            <div className="url-input-wrap">
              <span className="input-icon">↗</span>

              <input
                id="url-input"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={handleUrlChange}
                autoComplete="url"
                spellCheck="false"
                aria-label="URL to scan"
                disabled={loading}
              />

              <button type="submit" disabled={loading || !url.trim()}>
                {loading ? "Scanning..." : "Scan URL"}
                <span>{loading ? "..." : "→"}</span>
              </button>
            </div>
          </form>

          <div className="scanner-hint">
            <span>ⓘ</span>
            Analysis is processed by your local PhishSight API.
          </div>
        </section>

        <section className="overview">
          <div className="section-heading">
            <h3>Analysis overview</h3>
            <span>LIVE WORKSPACE</span>
          </div>

          <div className="overview-grid">
            <div className="metric-card">
              <span className="metric-icon purple">◎</span>
              <p>Detection engine</p>
              <h2>Character ML</h2>
              <small>TF-IDF + LinearSVC</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon green">⌘</span>
              <p>Analysis approach</p>
              <h2>Hybrid</h2>
              <small>ML + explainable rules</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon blue">◉</span>
              <p>Execution mode</p>
              <h2>Local API</h2>
              <small>FastAPI backend</small>
            </div>
          </div>
        </section>

        {loading && (
          <section className="result-card loading-card" aria-live="polite">
            <span className="loading-spinner" />
            <div>
              <h3>Analyzing URL...</h3>
              <p>Waiting for the PhishSight analysis engine.</p>
            </div>
          </section>
        )}

        {error && (
          <section className="result-card error-card" role="alert">
            <span className="result-label">SCAN ERROR</span>
            <h3>Scan could not be completed</h3>
            <p>{error}</p>
            <small>
              Check that the FastAPI server is running at 127.0.0.1:8000.
            </small>
          </section>
        )}

        {result && (
          <section className="results-section" aria-live="polite">
            <div className="section-heading">
              <h3>Scan results</h3>
              <span>ANALYSIS COMPLETE</span>
            </div>

            <div className="result-card">
              <div className="result-topline">
                <span className="result-label">MACHINE LEARNING</span>
                <span
                  className={`prediction-badge ${
                    prediction?.prediction === "phishing"
                      ? "prediction-danger"
                      : prediction?.prediction === "legitimate"
                        ? "prediction-safe"
                        : "prediction-unknown"
                  }`}
                >
                  {prediction?.status === "available"
                    ? prediction.prediction
                    : "Unavailable"}
                </span>
              </div>

              <h3>
                {prediction?.prediction === "phishing"
                  ? "Potential phishing detected"
                  : prediction?.prediction === "legitimate"
                    ? "Model classified this URL as legitimate"
                    : "ML prediction unavailable"}
              </h3>

              <p className="result-url">{result.url}</p>

              {prediction?.status === "available" && (
                <div className="result-details">
                  <div>
                    <span>MODEL</span>
                    <strong>
                      {prediction.model ?? "Character ML"}
                    </strong>
                  </div>

                  <div>
                    <span>PREDICTED LABEL</span>
                    <strong>
                      {prediction.predicted_label ?? "Unavailable"}
                    </strong>
                  </div>

                  <div>
                    <span>DECISION SCORE</span>
                    <strong>
                      {typeof prediction.decision_score === "number"
                        ? prediction.decision_score.toFixed(5)
                        : "Unavailable"}
                    </strong>
                  </div>
                </div>
              )}

              {prediction?.message && (
                <p className="score-note">{prediction.message}</p>
              )}

              {prediction?.score_note && (
                <p className="score-note">{prediction.score_note}</p>
              )}

              <div className="result-disclaimer">
                A model prediction is an indicator, not proof that a URL is
                safe or malicious. A positive decision score favors the
                legitimate class in this model; it is not a probability.
              </div>
            </div>

            <div className="result-card">
              <div className="result-topline">
                <span className="result-label">RULE-BASED ANALYSIS</span>
                <span className="category-badge">
                  {assessment?.category ?? "Unavailable"}
                </span>
              </div>

              <h3>Heuristic assessment</h3>

              <p>
                {assessment?.summary ??
                  "No heuristic summary was returned by the API."}
              </p>

              <div className="result-details">
                <div>
                  <span>RULES VERSION</span>
                  <strong>
                    {assessment?.rules_version ?? "Unavailable"}
                  </strong>
                </div>

                <div>
                  <span>INDICATORS FOUND</span>
                  <strong>
                    {assessment?.indicator_count ?? indicators.length}
                  </strong>
                </div>

                <div>
                  <span>ASSESSMENT METHOD</span>
                  <strong>
                    {assessment?.method ?? "Unavailable"}
                  </strong>
                </div>
              </div>

              <h4>Detected indicators</h4>

              {indicators.length > 0 ? (
                <ul className="indicator-list">
                  {indicators.map((indicator, index) => (
                    <li key={indicator.code ?? index}>
                      <strong>
                        {indicator.message ??
                          indicator.description ??
                          indicator.code ??
                          `Indicator ${index + 1}`}
                      </strong>

                      {indicator.code && indicator.message && (
                        <small>{indicator.code}</small>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-indicators">
                  No indicators were detected by the current heuristic rules.
                  This does not guarantee that the URL is safe.
                </p>
              )}

              {assessment?.limitations && (
                <p className="result-disclaimer">{assessment.limitations}</p>
              )}
            </div>

            <div className="result-card">
              <span className="result-label">URL STRUCTURE</span>
              <h3>Extracted features</h3>
              <p>
                These are the URL characteristics extracted by your backend
                for its rule-based analysis.
              </p>

              <div className="feature-list">
                {Object.entries(features).map(([name, value]) => (
                  <div className="feature-row" key={name}>
                    <span>{name.replaceAll("_", " ")}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer>
          <span>
            PHISHSIGHT <span className="footer-separator">/</span> SECURITY
            RESEARCH PROJECT
          </span>
          <span>EXPERIMENTAL · NOT A GUARANTEE OF SAFETY</span>
        </footer>
      </main>
    </div>
  );
}

export default App;