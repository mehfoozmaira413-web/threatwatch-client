import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  connectSocket,
  socket,
} from "../socket";

function ModeratorPage() {
  const [stats, setStats] =
    useState({
      totalScans: 0,
      safe: 0,
      threats: 0,
      uncertain: 0,
    });

  const [scans, setScans] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const getToken = () =>
    localStorage.getItem(
      "token"
    );

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadModeratorDashboard =
    useCallback(
      async () => {
        try {
          setError("");

          const token =
            getToken();

          if (!token) {
            setError(
              "Authentication token not found."
            );

            return;
          }

          const response =
            await fetch(
              "http://localhost:5001/api/moderator/dashboard",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  "Content-Type":
                    "application/json",
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Could not load moderator dashboard."
            );
          }

          setStats({
            totalScans:
              data.stats
                ?.totalScans || 0,

            safe:
              data.stats?.safe ||
              0,

            threats:
              data.stats?.threats ||
              0,

            uncertain:
              data.stats
                ?.uncertain || 0,
          });

          setScans(
            Array.isArray(
              data.scans
            )
              ? data.scans
              : []
          );
        } catch (err) {
          console.error(
            err
          );

          setError(
            err.message
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  // ===================================================
  // INITIAL LOAD + SOCKET
  // ===================================================

  useEffect(() => {
    loadModeratorDashboard();

    connectSocket();

    socket.emit(
      "join_dashboard",
      "moderator"
    );

    const handleScanCompleted =
      (newScan) => {
        console.log(
          "📡 MODERATOR NEW SCAN:",
          newScan
        );

        setScans(
          (previous) => {
            const exists =
              previous.some(
                (scan) =>
                  String(
                    scan._id
                  ) ===
                  String(
                    newScan._id
                  )
              );

            if (exists) {
              return previous;
            }

            return [
              newScan,
              ...previous,
            ];
          }
        );

        setStats(
          (previous) => ({
            totalScans:
              previous.totalScans +
              1,

            safe:
              newScan.verdict ===
                "SAFE" ||
              newScan.verdict ===
                "LIKELY_TRUE"
                ? previous.safe +
                  1
                : previous.safe,

            threats:
              newScan.verdict ===
                "THREAT" ||
              newScan.verdict ===
                "LIKELY_FALSE"
                ? previous.threats +
                  1
                : previous.threats,

            uncertain:
              newScan.verdict ===
              "UNCERTAIN"
                ? previous.uncertain +
                  1
                : previous.uncertain,
          })
        );
      };

    socket.on(
      "scan_completed",
      handleScanCompleted
    );

    return () => {
      socket.off(
        "scan_completed",
        handleScanCompleted
      );
    };
  }, [
    loadModeratorDashboard,
  ]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      setRefreshing(true);

      await loadModeratorDashboard();
    };

  // ===================================================
  // VERDICT
  // ===================================================

  const getVerdictClass =
    (verdict) => {
      switch (verdict) {
        case "SAFE":
        case "LIKELY_TRUE":
          return "safe";

        case "THREAT":
        case "LIKELY_FALSE":
          return "threat";

        default:
          return "uncertain";
      }
    };

  // ===================================================
  // DATE
  // ===================================================

  const formatDate =
    (date) => {
      if (!date) {
        return "N/A";
      }

      return new Date(
        date
      ).toLocaleString();
    };

  return (
    <div className="moderator-page">

      <section className="admin-hero moderator-hero">
        <div>

          <div className="hero-badge">
            ◈ MODERATOR ACCESS
          </div>

          <h1>
            MODERATOR DASHBOARD
          </h1>

          <p>
            Monitor verification
            activity and review
            security results in
            real-time.
          </p>

        </div>
      </section>

      {error && (
        <div className="moderator-api-error">

          <strong>
            ⚠ MODERATOR API ERROR
          </strong>

          <p>
            {error}
          </p>

          <button
            onClick={
              handleRefresh
            }
          >
            ↻ RETRY
          </button>

        </div>
      )}

      <section className="moderator-stats">

        <div className="admin-stat-card">
          <span>◉</span>

          <div>
            <strong>
              {stats.totalScans}
            </strong>

            <small>
              TOTAL SCANS
            </small>
          </div>
        </div>

        <div className="admin-stat-card">
          <span>✓</span>

          <div>
            <strong>
              {stats.safe}
            </strong>

            <small>
              SAFE
            </small>
          </div>
        </div>

        <div className="admin-stat-card">
          <span>!</span>

          <div>
            <strong>
              {stats.threats}
            </strong>

            <small>
              THREATS
            </small>
          </div>
        </div>

        <div className="admin-stat-card">
          <span>◌</span>

          <div>
            <strong>
              {stats.uncertain}
            </strong>

            <small>
              UNCERTAIN
            </small>
          </div>
        </div>

      </section>

      <section className="admin-panel moderator-panel">

        <div className="admin-panel-header">

          <div>
            <h2>
              🛡 SECURITY MONITOR
            </h2>

            <p>
              Live verification
              activity
            </p>
          </div>

          <button
            className="history-refresh"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
          >
            {refreshing
              ? "↻ LOADING..."
              : "↻ REFRESH"}
          </button>

        </div>

        {loading ? (
          <div className="moderator-empty">
            <div>◌</div>

            <p>
              Loading security
              records...
            </p>
          </div>
        ) : scans.length === 0 ? (
          <div className="moderator-empty">
            <div>◎</div>

            <p>
              NO RECORDS FOUND
            </p>
          </div>
        ) : (
          <div className="moderator-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>
                    TYPE
                  </th>

                  <th>
                    USER
                  </th>

                  <th>
                    VERDICT
                  </th>

                  <th>
                    RISK
                  </th>

                  <th>
                    CONFIDENCE
                  </th>

                  <th>
                    DATE
                  </th>
                </tr>
              </thead>

              <tbody>

                {scans.map(
                  (scan) => (
                    <tr
                      key={
                        scan._id
                      }
                    >

                      <td>
                        {
                          scan.scanType ||
                          "N/A"
                        }
                      </td>

                      <td>
                        {scan.user
                          ?.name ||
                          scan.user
                            ?.email ||
                          "Unknown User"}
                      </td>

                      <td>

                        <span
                          className={`moderator-verdict ${getVerdictClass(
                            scan.verdict
                          )}`}
                        >
                          {
                            scan.verdict ||
                            "UNCERTAIN"
                          }
                        </span>

                      </td>

                      <td>
                        {
                          scan.riskScore ??
                          0
                        }
                        %
                      </td>

                      <td>
                        {
                          scan.confidenceScore ??
                          0
                        }
                        %
                      </td>

                      <td>
                        {formatDate(
                          scan.createdAt
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default ModeratorPage;