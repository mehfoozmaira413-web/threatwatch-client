import { useEffect, useState } from "react";
import "./History.css";

const API_URL = "https://threatwatch-server-production.up.railway.app";

export default function History() {
  const [scans, setScans] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // =====================================================
  // FETCH SCAN HISTORY
  // =====================================================

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/api/scans`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        console.log("HISTORY RESPONSE:", data);

        // -------------------------------------------------
        // AUTH ERROR
        // -------------------------------------------------

        if (res.status === 401) {
          localStorage.removeItem("token");

          setScans([]);
          setError(
            "Your session has expired. Please login again."
          );

          return;
        }

        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        if (!res.ok) {
          throw new Error(
            data.message || "Failed to load scan history."
          );
        }

        // -------------------------------------------------
        // BACKEND ARRAY RESPONSE
        // -------------------------------------------------

        if (Array.isArray(data)) {
          setScans(data);
        }

        // -------------------------------------------------
        // BACKEND OBJECT RESPONSE
        // -------------------------------------------------

        else if (Array.isArray(data.scans)) {
          setScans(data.scans);
        }

        else {
          setScans([]);
        }

      } catch (error) {
        console.error("HISTORY ERROR:", error);

        setError(
          error.message ||
            "Unable to load scan history."
        );

        setScans([]);

      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);


  // =====================================================
  // DELETE SCAN
  // =====================================================

  const handleDelete = async (scanId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    // ---------------------------------------------------
    // Confirmation
    // ---------------------------------------------------

    const confirmed = window.confirm(
      "Are you sure you want to delete this scan?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(scanId);
      setError("");

      console.log("🗑 Deleting scan:", scanId);

      // -------------------------------------------------
      // DELETE REQUEST
      // -------------------------------------------------

      const res = await fetch(
        `${API_URL}/api/scans/${scanId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      console.log("DELETE RESPONSE:", data);

      // -------------------------------------------------
      // AUTH ERROR
      // -------------------------------------------------

      if (res.status === 401) {
        localStorage.removeItem("token");

        setScans([]);

        setError(
          "Your session has expired. Please login again."
        );

        return;
      }

      // -------------------------------------------------
      // DELETE ERROR
      // -------------------------------------------------

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to delete scan."
        );
      }

      // -------------------------------------------------
      // REMOVE FROM FRONTEND
      // -------------------------------------------------

      setScans((previousScans) =>
        previousScans.filter(
          (scan) => scan._id !== scanId
        )
      );

      console.log("✅ Scan deleted successfully");

    } catch (error) {
      console.error("DELETE ERROR:", error);

      setError(
        error.message ||
          "Unable to delete scan."
      );

    } finally {
      setDeletingId(null);
    }
  };


  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const searchText = search.toLowerCase().trim();

  const filteredScans = scans.filter((scan) => {
    const url = String(
      scan.url || ""
    ).toLowerCase();

    const summary = String(
      scan.summary || ""
    ).toLowerCase();

    const scanType = String(
      scan.scanType || ""
    ).toLowerCase();

    const verdict = String(
      scan.verdict || ""
    ).toLowerCase();

    const matchesSearch =
      !searchText ||
      url.includes(searchText) ||
      summary.includes(searchText) ||
      scanType.includes(searchText) ||
      verdict.includes(searchText);

    // SAFE
    if (filter === "safe") {
      return (
        matchesSearch &&
        scan.isSafe === true
      );
    }

    // THREAT
    if (filter === "threat") {
      return (
        matchesSearch &&
        scan.isSafe === false
      );
    }

    // ALL
    return matchesSearch;
  });


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "N/A";
    }
  };


  // =====================================================
  // GET SCAN TYPE
  // =====================================================

  const getScanType = (scan) => {
    return scan.scanType || "SCAN";
  };


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="history-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="history-header">

        <div>
          <h1>SCAN HISTORY</h1>

          <p>
            Your previous ThreatWatch AI
            verifications
          </p>
        </div>

        <div className="history-count">

          <strong>
            {scans.length}
          </strong>

          <span>
            Total Scans
          </span>

        </div>

      </div>


      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="history-controls">

        <input
          type="text"
          placeholder="🔍 Search scans..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >

          <option value="all">
            All Scans
          </option>

          <option value="safe">
            Safe
          </option>

          <option value="threat">
            Threats
          </option>

        </select>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {!loading && error && (
        <div className="history-message error-message">
          <strong>
            {error}
          </strong>
        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="history-message">
          Loading scan history...
        </div>
      )}


      {/* =================================================
          NO SCANS
      ================================================= */}

      {!loading &&
        !error &&
        filteredScans.length === 0 && (
          <div className="history-message">
            No scans found.
          </div>
        )}


      {/* =================================================
          SCAN LIST
      ================================================= */}

      {!loading &&
        !error &&
        filteredScans.length > 0 && (

          <div className="scan-list">

            {filteredScans.map((scan) => (

              <div
                className="scan-card"
                key={scan._id}
              >

                {/* ======================================
                    TOP
                ====================================== */}

                <div className="scan-top">

                  <div className="scan-url">

                    <span className="scan-type">
                      {getScanType(scan)}
                    </span>

                    <span className="scan-url-text">
                      {scan.url ||
                        "No URL available"}
                    </span>

                  </div>


                  <div
                    className={
                      scan.isSafe
                        ? "status safe"
                        : "status danger"
                    }
                  >

                    {scan.isSafe
                      ? "✓ SAFE"
                      : "⚠ THREAT"}

                  </div>

                </div>


                {/* ======================================
                    DETAILS
                ====================================== */}

                <div className="scan-details">

                  <div>
                    <span>
                      RISK SCORE
                    </span>

                    <strong>
                      {scan.riskScore ?? 0}%
                    </strong>
                  </div>


                  <div>
                    <span>
                      CONFIDENCE
                    </span>

                    <strong>
                      {scan.confidenceScore ?? 0}%
                    </strong>
                  </div>


                  <div>
                    <span>
                      THREATS
                    </span>

                    <strong>
                      {scan.threats?.length || 0}
                    </strong>
                  </div>


                  <div>
                    <span>
                      DATE
                    </span>

                    <strong>
                      {formatDate(
                        scan.createdAt
                      )}
                    </strong>
                  </div>

                </div>


                {/* ======================================
                    VERDICT
                ====================================== */}

                <div className="scan-verdict">

                  <span>
                    VERDICT
                  </span>

                  <strong>
                    {scan.verdict ||
                      "UNCERTAIN"}
                  </strong>

                </div>


                {/* ======================================
                    THREAT TAGS
                ====================================== */}

                {Array.isArray(scan.threats) &&
                  scan.threats.length > 0 && (

                    <div className="threat-tags">

                      {scan.threats.map(
                        (threat, index) => (

                          <span
                            key={`${scan._id}-${index}`}
                          >
                            {threat}
                          </span>

                        )
                      )}

                    </div>

                  )}


                {/* ======================================
                    SUMMARY
                ====================================== */}

                <p className="scan-summary">

                  {scan.summary ||
                    "No summary available."}

                </p>


                {/* ======================================
                    DELETE BUTTON
                ====================================== */}

                <div className="scan-actions">

                  <button
                    type="button"
                    className="delete-scan-btn"
                    onClick={() =>
                      handleDelete(scan._id)
                    }
                    disabled={
                      deletingId === scan._id
                    }
                  >

                    {deletingId === scan._id
                      ? "Deleting..."
                      : "🗑 Delete Scan"}

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

    </div>
  );
}