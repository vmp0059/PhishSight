
import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/analyze-url";
const MAX_HISTORY = 10;

function formatFeatureName(name) {
  return name.replaceAll("_", " ");
}

function formatLabel(value) {
  return String(value ?? "Unavailable")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPrediction(result) {
  const prediction = result?.ml_prediction;

  if (prediction?.status && prediction.status !== "available") {
    return "unavailable";
  }

  return prediction?.prediction ?? "unavailable";
}

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("scanner");

  async function handleScan(event) {
    event.preventDefault();

    const targetUrl = url.trim();

    if (!targetUrl) {
      setError("Please enter a URL.");
      setResult(null);
      return;
    }

    if (/\s/.test(targetUrl)) {
      setError("The URL cannot contain spaces. Check the address and try again.");
      setResult(null);
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(targetUrl)
          ? targetUrl
          : `https://${targetUrl}`
      );
    } catch {
      setError("This doesn't look like a valid URL. Enter a domain such as example.com.");
      setResult(null);
      return;
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname.includes(".")
    ) {
      setError("Enter a valid HTTP or HTTPS website URL.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : data.detail
              ? JSON.stringify(data.detail)
              : `Request failed (${response.status})`;

        throw new Error(detail);
      }

      setResult(data);
      setActivePage("analysis");

      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        url: data.url ?? targetUrl,
        result: data,
        scannedAt: new Date().toLocaleString(),
      };

      setHistory((previous) =>
        [entry, ...previous].slice(0, MAX_HISTORY)
      );
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Could not connect to the API. Make sure your FastAPI server is running at 127.0.0.1:8000."
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred."
      );

      setActivePage("scanner");
    } finally {
      setLoading(false);
    }
  }

  function handleUrlChange(event) {
    setUrl(event.target.value);
    setError("");
  }

  function openHistoryItem(item) {
    setUrl(item.url);
    setResult(item.result);
    setError("");
    setActivePage("analysis");
  }

  function clearHistory() {
    setHistory([]);
  }

  const prediction = result?.ml_prediction;
  const assessment = result?.assessment;
  const features = result?.features ?? {};
  const indicators = assessment?.indicators ?? [];
  const predictedLabel = getPrediction(result);

  const pageTitles = {
    scanner: "URL SCANNER",
    analysis: "THREAT ANALYSIS",
    history: "SCAN HISTORY",
  };

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

        <button
          type="button"
          className={`nav-item ${activePage === "scanner" ? "active" : ""}`}
          onClick={() => setActivePage("scanner")}
        >
          <span className="nav-symbol">⌕</span>
          URL Scanner
        </button>

        <button
          type="button"
          className={`nav-item ${activePage === "analysis" ? "active" : ""}`}
          onClick={() => setActivePage("analysis")}
        >
          <span className="nav-symbol">◈</span>
          Threat Analysis
        </button>

        <button
          type="button"
          className={`nav-item ${activePage === "history" ? "active" : ""}`}
          onClick={() => setActivePage("history")}
        >
          <span className="nav-symbol">◷</span>
          Scan History
        </button>

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
            <span className="breadcrumb-current">
              {" "}{pageTitles[activePage]}
            </span>
          </div>

          <div className="system-status">
            <span className="status-dot" />
            System initialized
          </div>
        </header>

        {/* URL SCANNER PAGE */}
        {activePage === "scanner" && (
          <>
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
                  <p>Enter a website address to begin your analysis.</p>
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
                    maxLength={2048}
                  />

                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                  >
                    {loading ? "Scanning..." : "Scan URL"}
                    <span>{loading ? "…" : "→"}</span>
                  </button>
                </div>
              </form>

              <div className="scanner-hint">
                <span>ⓘ</span>
                Analysis is processed by your local PhishSight API.
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
                  Check the URL and confirm that the FastAPI server is running.
                </small>
              </section>
            )}

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
          </>
        )}

        {/* THREAT ANALYSIS PAGE */}
        {activePage === "analysis" && (
          <section className="page-content">
            <section className="welcome page-welcome">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                SECURITY REPORT
              </div>

              <h1>
                Threat <span>Analysis.</span>
              </h1>

              <p>
                Review the model classification, transparent rule-based
                assessment, and URL characteristics.
              </p>
            </section>

            {!result ? (
              <section className="result-card analysis-empty">
                <span className="empty-history-icon">◈</span>
                <h3>No scan results available</h3>
                <p>
                  Scan a URL first to see its ML prediction, heuristic
                  assessment, indicators, and extracted features.
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage("scanner")}
                >
                  Go to URL Scanner →
                </button>
              </section>
            ) : (
              <section className="results-section" aria-live="polite">
                <div className="section-heading">
                  <h3>Scan results</h3>
                  <span>ANALYSIS COMPLETE</span>
                </div>

                {/* ML RESULT */}
                <div className="result-card">
                  <div className="result-topline">
                    <span className="result-label">MACHINE LEARNING</span>
                    <span className={`prediction-badge prediction-${predictedLabel}`}>
                      {formatLabel(predictedLabel)}
                    </span>
                  </div>

                  <h3>
                    {predictedLabel === "phishing"
                      ? "Potential phishing detected"
                      : predictedLabel === "legitimate"
                        ? "Model classified this URL as legitimate"
                        : "ML prediction unavailable"}
                  </h3>

                  <p className="result-url">{result.url}</p>

                  {prediction?.status === "available" && (
                    <div className="result-details">
                      <div>
                        <span>MODEL</span>
                        <strong>{prediction.model ?? "Character ML"}</strong>
                      </div>

                      <div>
                        <span>PREDICTED LABEL</span>
                        <strong>{prediction.predicted_label ?? "Unavailable"}</strong>
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

                  {prediction?.score_note && (
                    <p className="score-note">{prediction.score_note}</p>
                  )}

                  {prediction?.message && (
                    <p className="score-note">{prediction.message}</p>
                  )}

                  <div className="result-disclaimer">
                    This is a model classification, not proof that the URL is
                    safe or malicious. The decision score is not a probability.
                  </div>
                </div>

                {/* HEURISTIC RESULT */}
                <div className="result-card">
                  <div className="result-topline">
                    <span className="result-label">RULE-BASED ANALYSIS</span>
                    <span className="category-badge">
                      {formatLabel(assessment?.category)}
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
                      <strong>{assessment?.rules_version ?? "Unavailable"}</strong>
                    </div>

                    <div>
                      <span>INDICATORS FOUND</span>
                      <strong>
                        {assessment?.indicator_count ?? indicators.length}
                      </strong>
                    </div>

                    <div>
                      <span>ASSESSMENT METHOD</span>
                      <strong>{assessment?.method ?? "Unavailable"}</strong>
                    </div>
                  </div>

                  <h4>Detected indicators</h4>

                  {indicators.length > 0 ? (
                    <ul className="indicator-list">
                      {indicators.map((indicator, index) => (
                        <li key={indicator.code ?? index}>
                          <span className="indicator-mark">!</span>
                          <div>
                            <strong>
                              {indicator.message ??
                                indicator.description ??
                                indicator.code ??
                                `Indicator ${index + 1}`}
                            </strong>

                            {indicator.code && (
                              <small>{formatLabel(indicator.code)}</small>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-indicators">
                      No indicators were detected by the current heuristic
                      rules. This does not guarantee that the URL is safe.
                    </p>
                  )}

                  {assessment?.limitations && (
                    <p className="result-disclaimer">
                      {assessment.limitations}
                    </p>
                  )}
                </div>

                {/* EXTRACTED URL FEATURES */}
                <div className="result-card">
                  <span className="result-label">URL STRUCTURE</span>
                  <h3>Extracted features</h3>

                  <p>
                    These characteristics were extracted by the backend for
                    its rule-based analysis.
                  </p>

                  {Object.keys(features).length > 0 ? (
                    <div className="feature-list">
                      {Object.entries(features).map(([name, value]) => (
                        <div className="feature-row" key={name}>
                          <span>{formatFeatureName(name)}</span>
                          <strong>{String(value)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No URL features were returned by the API.</p>
                  )}
                </div>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setActivePage("scanner")}
                >
                  ← Scan another URL
                </button>
              </section>
            )}
          </section>
        )}

        {/* SCAN HISTORY PAGE */}
        {activePage === "history" && (
          <section className="page-content history-section">
            <section className="welcome page-welcome">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                ACTIVITY LOG
              </div>

              <h1>
                Scan <span>History.</span>
              </h1>

              <p>
                Review your recent scans and reopen their analysis reports.
              </p>
            </section>

            <div className="section-heading">
              <div>
                <h3>Recent scans</h3>
                <p className="history-subtitle">
                  Your latest successful URL analyses.
                </p>
              </div>

              <div className="history-actions">
                <span>{history.length} / {MAX_HISTORY}</span>

                {history.length > 0 && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={clearHistory}
                  >
                    Clear history
                  </button>
                )}
              </div>
            </div>

            {history.length === 0 ? (
              <div className="result-card history-empty">
                <span className="empty-history-icon">◷</span>
                <h3>No scans yet</h3>
                <p>Your successful URL scans will appear here.</p>

                <button
                  type="button"
                  onClick={() => setActivePage("scanner")}
                >
                  Start your first scan →
                </button>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => {
                  const label = getPrediction(item.result);

                  return (
                    <button
                      className="history-item"
                      key={item.id}
                      type="button"
                      onClick={() => openHistoryItem(item)}
                    >
                      <div className="history-item-main">
                        <strong className="history-url">{item.url}</strong>
                        <span className="history-time">{item.scannedAt}</span>
                      </div>

                      <div className="history-item-meta">
                        <span className={`prediction-badge prediction-${label}`}>
                          {formatLabel(label)}
                        </span>

                        <span className="history-category">
                          {formatLabel(item.result.assessment?.category)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="history-note">
              History is temporary and clears when you refresh the page.
            </p>
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
