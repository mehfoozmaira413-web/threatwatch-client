import React, {
  useEffect,
  useState,
} from "react";

import {
  connectSocket,
  socket,
} from "../socket";

import "./Scanner.css";

const API_BASE =
  "https://threatwatch-server-production.up.railway.app1";

function Scanner() {
  const [scanType, setScanType] =
    useState("URL");

  const [url, setUrl] =
    useState("");

  const [text, setText] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [statusType, setStatusType] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  // ===================================================
  // SOCKET
  // ===================================================

  useEffect(() => {
    connectSocket();

    const handleStatus = (data) => {
      console.log(
        "SOCKET STATUS:",
        data
      );

      setStatus(
        data.message || ""
      );

      setStatusType(
        data.status || ""
      );

      if (
        data.status ===
        "completed"
      ) {
        setLoading(false);

        if (data.result) {
          setResult(
            data.result
          );
        }
      }

      if (
        data.status ===
        "error"
      ) {
        setLoading(false);
      }
    };

    socket.on(
      "scan_status",
      handleStatus
    );

    return () => {
      socket.off(
        "scan_status",
        handleStatus
      );
    };
  }, []);

  // ===================================================
  // IMAGE SELECT
  // ===================================================

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setImage(file);

    const reader =
      new FileReader();

    reader.onload = () => {
      setImagePreview(
        reader.result
      );
    };

    reader.readAsDataURL(file);
  };

  // ===================================================
  // RESET
  // ===================================================

  const resetResult = () => {
    setResult(null);
    setError("");
    setStatus("");
    setStatusType("");
  };

  // ===================================================
  // SCAN
  // ===================================================

  const handleScan = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      setError(
        "Please login first."
      );

      setLoading(false);

      return;
    }

    try {
      let endpoint = "";
      let body = {};

      // ------------------------------------------------
      // URL
      // ------------------------------------------------

      if (scanType === "URL") {
        if (!url.trim()) {
          throw new Error(
            "Please enter a URL."
          );
        }

        endpoint =
          `${API_BASE}/api/scan`;

        body = {
          url: url.trim(),
        };
      }

      // ------------------------------------------------
      // TEXT
      // ------------------------------------------------

      if (scanType === "TEXT") {
        if (!text.trim()) {
          throw new Error(
            "Please enter text."
          );
        }

        endpoint =
          `${API_BASE}/api/scan/text`;

        body = {
          text: text.trim(),
        };
      }

      // ------------------------------------------------
      // IMAGE
      // ------------------------------------------------

      if (scanType === "IMAGE") {
        if (!image) {
          throw new Error(
            "Please select an image."
          );
        }

        const imageData =
          await fileToBase64(
            image
          );

        endpoint =
          `${API_BASE}/api/scan/image`;

        body = {
          image: imageData,
          mimeType: image.type,
        };
      }

      setStatus(
        "Sending scan to ThreatWatch AI..."
      );

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Scan failed."
        );
      }

      // ------------------------------------------------
      // HTTP RESULT
      // ------------------------------------------------

      setResult(data);

      setStatus(
        "Scan completed successfully."
      );

      setStatusType(
        "completed"
      );

      setLoading(false);
    } catch (err) {
      console.error(
        "SCANNER ERROR:",
        err
      );

      setError(
        err.message ||
        "Scan failed."
      );

      setStatusType(
        "error"
      );

      setLoading(false);
    }
  };

  // ===================================================
  // VERDICT CLASS
  // ===================================================

  const verdictClass = (
    verdict
  ) => {
    if (
      verdict === "SAFE" ||
      verdict ===
        "LIKELY_TRUE"
    ) {
      return "safe";
    }

    if (
      verdict === "THREAT" ||
      verdict ===
        "LIKELY_FALSE"
    ) {
      return "threat";
    }

    return "uncertain";
  };

  return (
    <div className="scanner-page">
      <div className="scanner-container">

        {/* HEADER */}

        <div className="scanner-header">
          <div className="scanner-badge">
            ◈ THREATWATCH AI
          </div>

          <h1>
            SECURITY SCANNER
          </h1>

          <p>
            Analyze URLs, text and
            images using AI-powered
            threat verification.
          </p>
        </div>

        {/* TYPE BUTTONS */}

        <div className="scanner-tabs">

          <button
            className={
              scanType === "URL"
                ? "active"
                : ""
            }
            onClick={() => {
              setScanType("URL");
              resetResult();
            }}
          >
            🌐 URL
          </button>

          <button
            className={
              scanType === "TEXT"
                ? "active"
                : ""
            }
            onClick={() => {
              setScanType("TEXT");
              resetResult();
            }}
          >
            📝 TEXT
          </button>

          <button
            className={
              scanType === "IMAGE"
                ? "active"
                : ""
            }
            onClick={() => {
              setScanType("IMAGE");
              resetResult();
            }}
          >
            🖼 IMAGE
          </button>

        </div>

        {/* FORM */}

        <form
          className="scanner-card"
          onSubmit={
            handleScan
          }
        >

          {scanType === "URL" && (
            <>
              <label>
                Enter URL
              </label>

              <input
                type="url"
                value={url}
                onChange={(e) =>
                  setUrl(
                    e.target.value
                  )
                }
                placeholder="https://example.com"
                disabled={loading}
              />
            </>
          )}

          {scanType === "TEXT" && (
            <>
              <label>
                Enter suspicious
                text / claim
              </label>

              <textarea
                value={text}
                onChange={(e) =>
                  setText(
                    e.target.value
                  )
                }
                placeholder="Paste the claim or message here..."
                rows={8}
                disabled={loading}
              />
            </>
          )}

          {scanType === "IMAGE" && (
            <>
              <label>
                Upload image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageChange
                }
                disabled={loading}
              />

              {imagePreview && (
                <div className="image-preview">
                  <img
                    src={
                      imagePreview
                    }
                    alt="Preview"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="scan-button"
            disabled={loading}
          >
            {loading
              ? "◌ ANALYZING..."
              : "⚡ START SCAN"}
          </button>

        </form>

        {/* LIVE STATUS */}

        {status && (
          <div
            className={`scan-status ${statusType}`}
          >
            <span>
              {loading
                ? "◌"
                : "✓"}
            </span>

            <div>
              <strong>
                LIVE STATUS
              </strong>

              <p>
                {status}
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="scan-error">
            <strong>
              ⚠ SCAN ERROR
            </strong>

            <p>
              {error}
            </p>
          </div>
        )}

        {/* RESULT */}

        {result && (
          <div className="scan-result">

            <div className="result-header">
              <div>
                <span>
                  AI VERIFICATION
                </span>

                <h2>
                  Scan Result
                </h2>
              </div>

              <div
                className={`result-verdict ${verdictClass(
                  result.verdict
                )}`}
              >
                {result.verdict}
              </div>
            </div>

            {/* SCORES */}

            <div className="result-scores">

              <div>
                <small>
                  RISK SCORE
                </small>

                <strong>
                  {
                    result.riskScore ??
                    0
                  }
                  %
                </strong>
              </div>

              <div>
                <small>
                  CONFIDENCE
                </small>

                <strong>
                  {
                    result.confidenceScore ??
                    0
                  }
                  %
                </strong>
              </div>

            </div>

            {/* SUMMARY */}

            <div className="result-section">
              <h3>
                SUMMARY
              </h3>

              <p>
                {result.summary ||
                  "No summary available."}
              </p>
            </div>

            {/* CLAIMS */}

            {Array.isArray(
              result.claims
            ) &&
              result.claims.length >
                0 && (
                <div className="result-section">
                  <h3>
                    CLAIMS
                  </h3>

                  <ul>
                    {result.claims.map(
                      (
                        claim,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          {claim}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* THREATS */}

            {Array.isArray(
              result.threats
            ) &&
              result.threats.length >
                0 && (
                <div className="result-section threat-list">
                  <h3>
                    THREATS
                  </h3>

                  <ul>
                    {result.threats.map(
                      (
                        threat,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          {threat}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* REPORT */}

            {result.report && (
              <div className="result-section">
                <h3>
                  AI REPORT
                </h3>

                <p>
                  {result.report}
                </p>
              </div>
            )}

            {/* SOURCES */}

            {Array.isArray(
              result.sources
            ) &&
              result.sources.length >
                0 && (
                <div className="result-section">
                  <h3>
                    SOURCES
                  </h3>

                  {result.sources.map(
                    (
                      source,
                      index
                    ) => (
                      <div
                        className="source-item"
                        key={
                          index
                        }
                      >
                        <strong>
                          {
                            source.title
                          }
                        </strong>

                        {source.url && (
                          <a
                            href={
                              source.url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {
                              source.url
                            }
                          </a>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

          </div>
        )}

      </div>
    </div>
  );
}

// =====================================================
// FILE TO BASE64
// =====================================================

function fileToBase64(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

export default Scanner;