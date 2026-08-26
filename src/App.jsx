
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import Scanner from "./pages/Scanner";

const API_URL =  "https://threatwatch-server-production.up.railway.app";
;

/* =========================================================
   HELPERS
========================================================= */

const getToken = () => localStorage.getItem("token");

const getSavedUser = () => {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const normalizeRole = (role) =>
  String(role || "").trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
};

const getVerdict = (scan) => {
  const verdict = String(scan?.verdict || "")
    .trim()
    .toUpperCase();

  if (verdict === "SAFE") return "SAFE";
  if (verdict === "THREAT") return "THREAT";

  return "UNCERTAIN";
};

const getScanType = (scan) => {
  const type = String(scan?.scanType || "")
    .trim()
    .toUpperCase();

  if (["URL", "TEXT", "IMAGE"].includes(type)) {
    return type;
  }

  if (String(scan?.url || "").startsWith("TEXT_SCAN:")) {
    return "TEXT";
  }

  if (scan?.url === "IMAGE_SCAN") {
    return "IMAGE";
  }

  return "URL";
};

/* FIXED:
   ModeratorPage was using getUserEmail()
   but the old App.jsx did not define it.
*/
const getUserEmail = (scan) => {
  if (!scan) return "Unknown";

  if (scan.user?.email) {
    return scan.user.email;
  }

  if (scan.user?.name) {
    return scan.user.name;
  }

  if (scan.userEmail) {
    return scan.userEmail;
  }

  return "Unknown";
};

async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    message:
      text || "Server returned an invalid response.",
  };
}

/* =========================================================
   MATRIX BACKGROUND
========================================================= */

function MatrixBackground({ theme = "dashboard" }) {
  useEffect(() => {
    const canvas = document.getElementById("matrix");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let animationFrame;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: 1.5 + Math.random() * 2.5,
    }));

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const ratio = window.devicePixelRatio || 1;

      canvas.width = width * ratio;
      canvas.height = height * ratio;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
      );
    };

    const draw = () => {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        height
      );

      if (theme === "history") {
        gradient.addColorStop(0, "#030618");
        gradient.addColorStop(1, "#001a3a");
      } else if (theme === "admin") {
        gradient.addColorStop(0, "#09020f");
        gradient.addColorStop(1, "#19002b");
      } else if (theme === "moderator") {
        gradient.addColorStop(0, "#020b12");
        gradient.addColorStop(1, "#00252c");
      } else {
        gradient.addColorStop(0, "#020812");
        gradient.addColorStop(1, "#001428");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      const isAdmin = theme === "admin";
      const isHistory = theme === "history";
      const isModerator = theme === "moderator";

      const gridColor = isAdmin
        ? "rgba(190,80,255,0.08)"
        : isHistory
        ? "rgba(94,115,255,0.08)"
        : isModerator
        ? "rgba(0,220,190,0.08)"
        : "rgba(0,210,255,0.08)";

      const nodeColor = isAdmin
        ? "#c45cff"
        : isHistory
        ? "#4d9fff"
        : isModerator
        ? "#00e0c0"
        : "#00d9ff";

      const nodeShadow = isAdmin
        ? "#b52cff"
        : isHistory
        ? "#4d9fff"
        : isModerator
        ? "#00caaa"
        : "#00bfff";

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      const gridSize = 70;

      for (
        let x = 0;
        x < width;
        x += gridSize
      ) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (
        let y = 0;
        y < height;
        y += gridSize
      ) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      nodes.forEach((node) => {
        node.z -= node.vz;
        node.x += node.vx;
        node.y += node.vy;

        if (node.z < 0) {
          node.z = 1000;
          node.x = Math.random() * width;
          node.y = Math.random() * height;
        }

        if (
          node.x < 0 ||
          node.x > width
        ) {
          node.vx *= -1;
        }

        if (
          node.y < 0 ||
          node.y > height
        ) {
          node.vy *= -1;
        }

        const perspective =
          1000 / (1000 - node.z);

        const x2d =
          width / 2 +
          (node.x - width / 2) *
            perspective;

        const y2d =
          height / 2 +
          (node.y - height / 2) *
            perspective;

        const size =
          2.5 * perspective;

        const opacity = Math.min(
          perspective * 0.9,
          1
        );

        ctx.beginPath();

        ctx.arc(
          x2d,
          y2d,
          size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = `${nodeColor}${Math.floor(
          opacity * 255
        )
          .toString(16)
          .padStart(2, "0")}`;

        ctx.shadowBlur =
          15 * perspective;

        ctx.shadowColor =
          nodeShadow;

        ctx.fill();

        nodes.forEach((other) => {
          if (node === other) return;

          const dx =
            node.x - other.x;

          const dy =
            node.y - other.y;

          const dz =
            node.z - other.z;

          const dist = Math.sqrt(
            dx * dx +
              dy * dy +
              dz * dz
          );

          if (dist < 180) {
            const p2 =
              1000 /
              (1000 - other.z);

            const ox2d =
              width / 2 +
              (other.x -
                width / 2) *
                p2;

            const oy2d =
              height / 2 +
              (other.y -
                height / 2) *
                p2;

            ctx.beginPath();

            ctx.moveTo(
              x2d,
              y2d
            );

            ctx.lineTo(
              ox2d,
              oy2d
            );

            const lineOpacity =
              (1 - dist / 180) *
              opacity *
              0.4;

            ctx.strokeStyle = `${nodeColor}${Math.floor(
              lineOpacity * 255
            )
              .toString(16)
              .padStart(2, "0")}`;

            ctx.lineWidth = 1;

            ctx.stroke();
          }
        });
      });

      ctx.shadowBlur = 0;

      animationFrame =
        requestAnimationFrame(
          draw
        );
    };

    resizeCanvas();
    draw();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, [theme]);

  return (
    <canvas
      id="matrix"
      className={`matrix-background ${theme}-background`}
    />
  );
}

/* =========================================================
   RESULT BOX
========================================================= */

function ResultBox({ result }) {
  const verdict =
    getVerdict(result);

  const safe =
    verdict === "SAFE";

  return (
    <div
      className={
        safe
          ? "result-box result-safe"
          : "result-box result-danger"
      }
    >
      <div className="result-header">
        <span>
          THREAT ANALYSIS RESULT
        </span>

        <span
          className={
            verdict === "SAFE"
              ? "badge safe-badge"
              : verdict === "THREAT"
              ? "badge danger-badge"
              : "badge"
          }
        >
          {verdict}
        </span>
      </div>

      <div className="risk-display">
        <strong>
          {result?.riskScore ?? 0}
        </strong>

        <span>
          RISK SCORE
        </span>
      </div>

      <div className="result-status">
        {verdict === "SAFE"
          ? "NO MAJOR THREAT DETECTED"
          : verdict === "THREAT"
          ? "THREAT DETECTED"
          : "RESULT REQUIRES REVIEW"}
      </div>

      {result?.summary && (
        <div className="result-section">
          <h4>
            ANALYSIS SUMMARY
          </h4>

          <p>
            {result.summary}
          </p>
        </div>
      )}

      {Array.isArray(
        result?.threats
      ) &&
        result.threats.length >
          0 && (
          <div className="result-section">
            <h4>
              DETECTED THREATS
            </h4>

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

      {Array.isArray(
        result?.claims
      ) &&
        result.claims.length >
          0 && (
          <div className="result-section">
            <h4>
              CLAIMS
            </h4>

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

      {result?.confidenceScore !==
        undefined && (
        <div className="result-section">
          <h4>
            CONFIDENCE
          </h4>

          <p>
            {
              result.confidenceScore
            }
            %
          </p>
        </div>
      )}

      {Array.isArray(
        result?.evidence
      ) &&
        result.evidence.length >
          0 && (
          <div className="result-section">
            <h4>
              EVIDENCE
            </h4>

            <ul>
              {result.evidence.map(
                (
                  item,
                  index
                ) => (
                  <li
                    key={
                      index
                    }
                  >
                    {item.finding ||
                      item.claim ||
                      "Evidence available"}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      {Array.isArray(
        result?.sources
      ) &&
        result.sources.length >
          0 && (
          <div className="result-section">
            <h4>
              SOURCES
            </h4>

            <ul>
              {result.sources.map(
                (
                  source,
                  index
                ) => (
                  <li
                    key={
                      index
                    }
                  >
                    {source.url ? (
                      <a
                        href={
                          source.url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.title ||
                          source.url}
                      </a>
                    ) : (
                      source.title ||
                      "Source"
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
    </div>
  );
}

/* =========================================================
   AUTH PAGE
========================================================= */

function AuthPage({
  setLoggedIn,
  setPage,
  setUser,
}) {
  const [mode, setMode] =
    useState("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submitAuth =
    async (e) => {
      e.preventDefault();

      if (
        mode === "register" &&
        !name.trim()
      ) {
        alert(
          "Please enter your full name."
        );
        return;
      }

      if (
        !email.trim() ||
        !password
      ) {
        alert(
          "Please enter your email and password."
        );
        return;
      }

      setLoading(true);

      try {
        const endpoint =
          mode === "login"
            ? "/api/auth/login"
            : "/api/auth/register";

        const body =
          mode === "login"
            ? {
                email:
                  email.trim(),
                password,
              }
            : {
                name:
                  name.trim(),
                email:
                  email.trim(),
                password,
              };

        const response =
          await fetch(
            `${API_URL}${endpoint}`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                body
              ),
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.details ||
              "Authentication failed."
          );
        }

        if (!data.token) {
          throw new Error(
            "Server did not return an authentication token."
          );
        }

        localStorage.setItem(
          "token",
          data.token
        );

        if (data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              data.user
            )
          );
        }

        /*
          IMPORTANT:
          setUser is App's afterLogin()
          function.

          It immediately updates:
          - user
          - loggedIn
          - role
          - page

          Therefore NO REFRESH is required.
        */
        setUser(
          data.user || {
            email:
              email.trim(),
          }
        );

        setLoggedIn(true);

        const role =
          normalizeRole(
            data.user?.role
          );

        if (
          role === "admin"
        ) {
          setPage("admin");
        } else if (
          role ===
          "moderator"
        ) {
          setPage(
            "moderator"
          );
        } else {
          setPage(
            "dashboard"
          );
        }
      } catch (error) {
        console.error(
          "AUTH ERROR:",
          error
        );

        alert(
          error.message ||
            "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          &gt;_
        </div>

        <div className="auth-system">
          THREATWATCH //
          SECURE CYBER
          SYSTEM
        </div>

        <h1>
          THREATWATCH{" "}
          <span>AI</span>
        </h1>

        <p className="auth-subtitle">
          AI-POWERED
          CYBERSECURITY
          <br />
          THREAT DETECTION
          PLATFORM
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={
              mode === "login"
                ? "auth-tab active"
                : "auth-tab"
            }
            onClick={() =>
              setMode(
                "login"
              )
            }
          >
            LOGIN
          </button>

          <button
            type="button"
            className={
              mode ===
              "register"
                ? "auth-tab active"
                : "auth-tab"
            }
            onClick={() =>
              setMode(
                "register"
              )
            }
          >
            REGISTER
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={
            submitAuth
          }
        >
          {mode ===
            "register" && (
            <>
              <label>
                FULL NAME
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(
                  e
                ) =>
                  setName(
                    e.target
                      .value
                  )
                }
                required
              />
            </>
          )}

          <label>
            EMAIL ADDRESS
          </label>

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(
              e
            ) =>
              setEmail(
                e.target.value
              )
            }
            required
          />

          <label>
            PASSWORD
          </label>

          <input
            type="password"
            placeholder="Enter your secure password"
            value={password}
            onChange={(
              e
            ) =>
              setPassword(
                e.target.value
              )
            }
            required
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "AUTHENTICATING..."
              : mode ===
                "login"
              ? "LOGIN TO SECURE SYSTEM"
              : "CREATE SECURE ACCOUNT"}
          </button>
        </form>

        <div className="auth-footer">
          <span className="green-dot" />

          <span>
            SYSTEM PROTECTED
          </span>

          <span className="auth-line" />

          <span>
            ENCRYPTED ACCESS
          </span>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   THEME TOGGLE
========================================================= */

function ThemeToggle({
  theme,
  toggleTheme,
}) {
  const isLight =
    theme === "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${
        isLight
          ? "light"
          : "dark"
      }`}
      onClick={
        toggleTheme
      }
      aria-label={
        isLight
          ? "Switch to dark mode"
          : "Switch to light mode"
      }
      title={
        isLight
          ? "Switch to dark mode"
          : "Switch to light mode"
      }
    >
      <span className="theme-toggle-icon">
        {isLight
          ? "☀"
          : "☾"}
      </span>

      <span>
        {isLight
          ? "LIGHT"
          : "DARK"}
      </span>
    </button>
  );
}

/* =========================================================
   PUBLIC NAVBAR
========================================================= */

function PublicNavbar({
  onLogin,
  theme,
  toggleTheme,
}) {
  return (
    <header className="navbar public-navbar">
      <div className="brand">
        <span className="brand-icon">
          &gt;_
        </span>

        <span className="brand-name">
          THREATWATCH
        </span>

        <span className="brand-ai">
          AI
        </span>
      </div>

      <nav className="nav-links">
        <button
          className="nav-button active"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            })
          }
        >
          ⓘ ABOUT
        </button>

        <ThemeToggle
          theme={theme}
          toggleTheme={
            toggleTheme
          }
        />

        <button
          className="nav-button login-nav-button"
          onClick={onLogin}
        >
          ⇥ LOGIN /
          REGISTER
        </button>
      </nav>
    </header>
  );
}

/* =========================================================
   LOGGED-IN NAVBAR
========================================================= */

function Navbar({
  page,
  setPage,
  logout,
  user,
  theme,
  toggleTheme,
}) {
  const role =
    normalizeRole(
      user?.role
    );

  const isAdmin =
    role === "admin";

  const isModerator =
    role ===
    "moderator";

  const goTo = (
    target
  ) => {
    setPage(target);

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  };

  return (
    <header className="navbar logged-navbar">
      <div
        className="brand clickable-brand"
        onClick={() =>
          goTo(
            isAdmin
              ? "admin"
              : isModerator
              ? "moderator"
              : "dashboard"
          )
        }
      >
        <span className="brand-icon">
          &gt;_
        </span>

        <span className="brand-name">
          THREATWATCH
        </span>

        <span className="brand-ai">
          AI
        </span>
      </div>

      <nav className="nav-links">
        {isAdmin && (
          <button
            className={`nav-button admin-nav ${
              page === "admin"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("admin")
            }
          >
            🛡 ADMIN
          </button>
        )}

        {isModerator && (
          <button
            className={`nav-button moderator-nav ${
              page ===
              "moderator"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo(
                "moderator"
              )
            }
          >
            ◈ MODERATOR
          </button>
        )}

        <button
          className={`nav-button ${
            page === "dashboard"
              ? "active"
              : ""
          }`}
          onClick={() =>
            goTo("dashboard")
          }
        >
          ⚡{" "}
          {isAdmin ||
          isModerator
            ? "SCANNER"
            : "DASHBOARD"}
        </button>

        <button
          className={`nav-button ${
            page === "history"
              ? "active"
              : ""
          }`}
          onClick={() =>
            goTo("history")
          }
        >
          ◷ HISTORY
        </button>

        <button
          className={`nav-button ${
            page === "about"
              ? "active"
              : ""
          }`}
          onClick={() =>
            goTo("about")
          }
        >
          ⓘ ABOUT
        </button>

        <ThemeToggle
          theme={theme}
          toggleTheme={
            toggleTheme
          }
        />

        <button
          className="nav-button logout-button"
          onClick={logout}
        >
          ⇥ LOGOUT
        </button>
      </nav>
    </header>
  );
}

/* =========================================================
   STATISTICS
========================================================= */

function Statistics({
  stats,
}) {
  const total =
    stats.safe +
    stats.threats;

  return (
    <section className="stats-section">
      <div className="stat-card safe-card">
        <div className="stat-icon">
          ✓
        </div>

        <div className="stat-info">
          <span>
            SAFE SCANS
          </span>

          <strong>
            {stats.safe}
          </strong>

          <small>
            SECURITY SCANS
            COMPLETED
          </small>
        </div>
      </div>

      <div className="stat-card threat-card">
        <div className="stat-icon">
          !
        </div>

        <div className="stat-info">
          <span>
            THREATS DETECTED
          </span>

          <strong>
            {stats.threats}
          </strong>

          <small>
            SUSPICIOUS
            SECURITY RESULTS
          </small>
        </div>
      </div>

      <div className="stat-card total-card">
        <div className="stat-icon">
          ◎
        </div>

        <div className="stat-info">
          <span>
            TOTAL ANALYSIS
          </span>

          <strong>
            {total}
          </strong>

          <small>
            COMPLETE
            SECURITY ANALYSIS
          </small>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   DASHBOARD / SCANNER
========================================================= */

function Dashboard({
  stats,
  setStats,
}) {
  const [url, setUrl] =
    useState("");

  const [text, setText] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [urlResult, setUrlResult] =
    useState(null);

  const [textResult, setTextResult] =
    useState(null);

  const [imageResult, setImageResult] =
    useState(null);

  const [loadingUrl, setLoadingUrl] =
    useState(false);

  const [loadingText, setLoadingText] =
    useState(false);

  const [loadingImage, setLoadingImage] =
    useState(false);

  const updateStats =
    (data) => {
      if (!data) return;

      const verdict =
        getVerdict(data);

      if (
        verdict ===
        "SAFE"
      ) {
        setStats(
          (previous) => ({
            ...previous,
            safe:
              previous.safe +
              1,
          })
        );
      } else if (
        verdict ===
        "THREAT"
      ) {
        setStats(
          (previous) => ({
            ...previous,
            threats:
              previous.threats +
              1,
          })
        );
      }
    };

  const scanUrl =
    async () => {
      if (!url.trim()) {
        alert(
          "Please enter a website URL."
        );
        return;
      }

      const token =
        getToken();

      if (!token) {
        alert(
          "Please login first."
        );
        return;
      }

      setLoadingUrl(
        true
      );

      setUrlResult(
        null
      );

      try {
        const response =
          await fetch(
            `${API_URL}/api/scan`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(
                {
                  url:
                    url.trim(),
                }
              ),
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.details ||
              data.message ||
              "URL scan failed."
          );
        }

        setUrlResult(
          data
        );

        updateStats(
          data
        );
      } catch (error) {
        console.error(
          "URL SCAN ERROR:",
          error
        );

        alert(
          `URL Scan Error:\n\n${error.message}`
        );
      } finally {
        setLoadingUrl(
          false
        );
      }
    };

  const analyzeText =
    async () => {
      if (!text.trim()) {
        alert(
          "Please enter some text or claim."
        );
        return;
      }

      const token =
        getToken();

      if (!token) {
        alert(
          "Please login first."
        );
        return;
      }

      setLoadingText(
        true
      );

      setTextResult(
        null
      );

      try {
        const response =
          await fetch(
            `${API_URL}/api/scan/text`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(
                {
                  text:
                    text.trim(),
                }
              ),
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.details ||
              data.message ||
              "Text analysis failed."
          );
        }

        setTextResult(
          data
        );

        updateStats(
          data
        );
      } catch (error) {
        console.error(
          "TEXT SCAN ERROR:",
          error
        );

        alert(
          `Text Scan Error:\n\n${error.message}`
        );
      } finally {
        setLoadingText(
          false
        );
      }
    };

  const imageToBase64 =
    (file) =>
      new Promise(
        (
          resolve,
          reject
        ) => {
          const reader =
            new FileReader();

          reader.onload =
            () =>
              resolve(
                reader.result
              );

          reader.onerror =
            () =>
              reject(
                new Error(
                  "Could not read the selected image."
                )
              );

          reader.readAsDataURL(
            file
          );
        }
      );

  const analyzeImage =
    async () => {
      if (!image) {
        alert(
          "Please select an image."
        );
        return;
      }

      const token =
        getToken();

      if (!token) {
        alert(
          "Please login first."
        );
        return;
      }

      setLoadingImage(
        true
      );

      setImageResult(
        null
      );

      try {
        const base64 =
          await imageToBase64(
            image
          );

        const response =
          await fetch(
            `${API_URL}/api/scan/image`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(
                {
                  image:
                    base64,
                  mimeType:
                    image.type,
                }
              ),
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.details ||
              data.message ||
              "Image analysis failed."
          );
        }

        setImageResult(
          data
        );

        updateStats(
          data
        );
      } catch (error) {
        console.error(
          "IMAGE SCAN ERROR:",
          error
        );

        alert(
          `Image Scan Error:\n\n${error.message}`
        );
      } finally {
        setLoadingImage(
          false
        );
      }
    };

  return (
    <main className="dashboard">
      <section className="dashboard-hero">
        <div className="hero-left">
          <div className="online-status">
            <span />
            SYSTEM ONLINE
          </div>

          <p className="hero-label">
            ADVANCED AI
            CYBERSECURITY
            <br />
            THREAT DETECTION
            SYSTEM
          </p>

          <h1>
            THREATWATCH{" "}
            <span>AI</span>
          </h1>

          <p className="hero-text">
            Protect your digital
            environment with
            intelligent security
            analysis. ThreatWatch
            AI examines suspicious
            URLs, written claims,
            and images to identify
            potentially dangerous,
            misleading, fraudulent,
            or suspicious content.
          </p>
        </div>

        <div className="hero-terminal">
          <div className="terminal-top">
            <span />
            <span />
            <span />
          </div>

          <div className="terminal-content">
            <p>
              &gt;
              THREATWATCH_AI
            </p>

            <p>
              &gt; SECURITY
              ENGINE: ONLINE
            </p>

            <p>
              &gt; AI ANALYSIS:
              READY
            </p>

            <p>
              &gt; THREAT
              MONITOR: ACTIVE
            </p>

            <p className="terminal-active">
              &gt; SYSTEM READY_
            </p>
          </div>
        </div>
      </section>

      <Statistics
        stats={stats}
      />

      <section className="scanner-section">
        {/* URL */}

        <div className="scanner-card url-card">
          <div className="scanner-header">
            <span className="card-number">
              01
            </span>

            <span>
              THREATWATCH //
              URL SCANNER
            </span>
          </div>

          <div className="scanner-body">
            <div className="scanner-icon">
              ↗
            </div>

            <h2>
              URL THREAT
              SCANNER
            </h2>

            <p>
              Examine a website
              address for suspicious
              characteristics
              including phishing
              attempts, scam patterns,
              deceptive domains, and
              potentially dangerous
              links.
            </p>

            <label>
              ENTER WEBSITE URL
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
            />

            <button
              className="scan-button"
              onClick={scanUrl}
              disabled={
                loadingUrl
              }
            >
              {loadingUrl
                ? "SCANNING URL..."
                : "SCAN URL FOR THREATS"}
            </button>

            {loadingUrl && (
              <div className="loading-text">
                ANALYZING
                WEBSITE...
              </div>
            )}

            {urlResult && (
              <ResultBox
                result={
                  urlResult
                }
              />
            )}
          </div>
        </div>

        {/* TEXT */}

        <div className="scanner-card text-card">
          <div className="scanner-header">
            <span className="card-number">
              02
            </span>

            <span>
              THREATWATCH //
              TEXT ANALYZER
            </span>
          </div>

          <div className="scanner-body">
            <div className="scanner-icon">
              Aa
            </div>

            <h2>
              TEXT / CLAIM
              SCANNER
            </h2>

            <p>
              Analyze written claims,
              statements, messages,
              and suspicious text
              for warning signs,
              manipulation,
              deceptive language,
              or misleading
              information.
            </p>

            <label>
              ENTER TEXT OR CLAIM
            </label>

            <textarea
              value={text}
              onChange={(e) =>
                setText(
                  e.target.value
                )
              }
              placeholder="Enter a claim, message, statement, or suspicious text..."
            />

            <button
              className="scan-button"
              onClick={
                analyzeText
              }
              disabled={
                loadingText
              }
            >
              {loadingText
                ? "ANALYZING TEXT..."
                : "ANALYZE TEXT FOR THREATS"}
            </button>

            {loadingText && (
              <div className="loading-text">
                ANALYZING
                TEXT...
              </div>
            )}

            {textResult && (
              <ResultBox
                result={
                  textResult
                }
              />
            )}
          </div>
        </div>

        {/* IMAGE */}

        <div className="scanner-card image-card">
          <div className="scanner-header">
            <span className="card-number">
              03
            </span>

            <span>
              THREATWATCH //
              IMAGE ANALYZER
            </span>
          </div>

          <div className="scanner-body">
            <div className="scanner-icon">
              ◫
            </div>

            <h2>
              IMAGE THREAT
              SCANNER
            </h2>

            <p>
              Upload a screenshot
              or image containing
              suspicious messages,
              advertisements,
              claims, links, or
              other digital content
              for AI-powered
              analysis.
            </p>

            <label>
              UPLOAD IMAGE FOR
              ANALYSIS
            </label>

            <label
              htmlFor="image-upload"
              className="image-upload"
            >
              {image ? (
                <img
                  src={URL.createObjectURL(
                    image
                  )}
                  alt="Selected"
                />
              ) : (
                <>
                  <span className="upload-icon">
                    +
                  </span>

                  <strong>
                    SELECT IMAGE
                  </strong>

                  <small>
                    PNG / JPG /
                    JPEG
                  </small>
                </>
              )}
            </label>

            <input
              id="image-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              onChange={(e) => {
                const file =
                  e.target
                    .files?.[0];

                if (file) {
                  setImage(
                    file
                  );

                  setImageResult(
                    null
                  );
                }
              }}
            />

            <button
              className="scan-button"
              onClick={
                analyzeImage
              }
              disabled={
                loadingImage
              }
            >
              {loadingImage
                ? "ANALYZING IMAGE..."
                : "ANALYZE IMAGE FOR THREATS"}
            </button>

            {loadingImage && (
              <div className="loading-text">
                ANALYZING
                IMAGE...
              </div>
            )}

            {imageResult && (
              <ResultBox
                result={
                  imageResult
                }
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   HISTORY
========================================================= */

function History({
  setPage,
  realtimeTick,
}) {
  const [scans, setScans] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState("ALL");

const [deletingId, setDeletingId] = useState(null);

  const loadHistory =
    async () => {
      const token =
        getToken();

      if (!token) {
        setError(
          "Please login again."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/scans`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.details ||
              "Could not load scan history."
          );
        }

        if (
          !Array.isArray(
            data
          )
        ) {
          throw new Error(
            "Server returned invalid history data."
          );
        }

        setScans(
          [...data].sort(
            (a, b) =>
              new Date(
                b.createdAt ||
                  0
              ) -
              new Date(
                a.createdAt ||
                  0
              )
          )
        );
      } catch (err) {
        setError(
          err.message ||
            "Could not load history."
        );
      } finally {
        setLoading(false);
      }
    };

    // =====================================================
// DELETE USER'S OWN SCAN
// =====================================================

const handleDeleteScan = async (scanId) => {
  const token = getToken();

  if (!token) {
    setError("Please login again.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this scan?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingId(scanId);
    setError("");

    const response = await fetch(
      `${API_URL}/api/scans/${scanId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await readResponse(response);

    if (response.status === 401) {
      localStorage.removeItem("token");

      setError(
        "Your session has expired. Please login again."
      );

      return;
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to delete scan."
      );
    }

    // Remove deleted scan immediately from UI
    setScans((previousScans) =>
      previousScans.filter(
        (scan) => scan._id !== scanId
      )
    );

  } catch (err) {
    console.error(
      "DELETE SCAN ERROR:",
      err
    );

    setError(
      err.message ||
        "Unable to delete scan."
    );
  } finally {
    setDeletingId(null);
  }
};

  useEffect(() => {
    loadHistory();
  }, [realtimeTick]);

  const filteredScans =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase();

      return scans.filter(
        (scan) => {
          const verdict =
            getVerdict(
              scan
            );

          const type =
            getScanType(
              scan
            );

          const searchable =
            `${scan.url || ""} ${
              scan.summary ||
              ""
            } ${(scan.threats || []).join(
              " "
            )} ${type} ${verdict}`.toLowerCase();

          return (
            (filter ===
              "ALL" ||
              verdict ===
                filter ||
              type ===
                filter) &&
            (!q ||
              searchable.includes(
                q
              ))
          );
        }
      );
    }, [
      scans,
      query,
      filter,
    ]);

  return (
    <main className="history-page">
      <section className="history-hero">
        <div>
          <p className="history-kicker">
            THREATWATCH //
            SECURITY DATABASE
          </p>

          <h1>
            SCAN HISTORY
          </h1>

          <p>
            Review previous
            security scans,
            risk scores,
            detected threats,
            and AI-generated
            analysis results.
          </p>
        </div>

        <div className="history-counter">
          <span>
            TOTAL RECORDS
          </span>

          <strong>
            {scans.length}
          </strong>
        </div>
      </section>

      <div className="history-toolbar">
        <input
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
          placeholder="Search URL, text, threat, verdict..."
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(
              e.target.value
            )
          }
        >
          <option value="ALL">
            ALL RESULTS
          </option>

          <option value="SAFE">
            SAFE
          </option>

          <option value="THREAT">
            THREAT
          </option>

          <option value="UNCERTAIN">
            UNCERTAIN
          </option>

          <option value="URL">
            URL
          </option>

          <option value="TEXT">
            TEXT
          </option>

          <option value="IMAGE">
            IMAGE
          </option>
        </select>

        <button
          className="history-refresh"
          onClick={
            loadHistory
          }
          disabled={
            loading
          }
        >
          {loading
            ? "LOADING..."
            : "↻ REFRESH"}
        </button>
      </div>

      <button
        className="back-dashboard"
        onClick={() =>
          setPage(
            "dashboard"
          )
        }
      >
        ← BACK TO SCANNER
      </button>

      {loading && (
        <div className="history-empty">
          <strong>
            ◌ LOADING
          </strong>

          <span>
            Loading security
            history...
          </span>
        </div>
      )}

      {!loading &&
        error && (
          <div className="history-empty error-box">
            <strong>
              HISTORY ERROR
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

      {!loading &&
        !error &&
        filteredScans.length ===
          0 && (
          <div className="history-empty">
            <strong>
              NO MATCHING
              RECORDS
            </strong>

            <span>
              Try another search
              or filter.
            </span>
          </div>
        )}

      {!loading &&
        !error &&
        filteredScans.length >
          0 && (
          <div className="history-list">
            {filteredScans.map(
              (
                scan,
                index
              ) => {
                const type =
                  getScanType(
                    scan
                  );

                const verdict =
                  getVerdict(
                    scan
                  );

                return (
                  <article
                    className={`history-item ${
                      verdict ===
                      "SAFE"
                        ? "safe-history"
                        : verdict ===
                          "THREAT"
                        ? "threat-history"
                        : "uncertain-history"
                    }`}
                    key={
                      scan._id ||
                      `${index}-${scan.createdAt}`
                    }
                  >
                    <div className="history-item-top">
                      <div>
                        <strong>
                          SECURITY
                          SCAN #
                          {index +
                            1}
                        </strong>

                        <span className="history-type">
                          {type}{" "}
                          ANALYSIS
                        </span>
                      </div>

                      <span
                        className={`badge ${
                          verdict ===
                          "SAFE"
                            ? "safe-badge"
                            : verdict ===
                              "THREAT"
                            ? "danger-badge"
                            : "uncertain-badge"
                        }`}
                      >
                        {
                          verdict
                        }
                      </span>
                    </div>

                    <div className="history-grid">
                      <div className="history-field">
                        <span>
                          ANALYSIS
                          TYPE
                        </span>

                        <strong>
                          {type}
                        </strong>
                      </div>

                      <div className="history-field">
                        <span>
                          RISK SCORE
                        </span>

                        <strong>
                          {
                            scan.riskScore ??
                            0
                          }
                          %
                        </strong>
                      </div>

                      <div className="history-field">
                        <span>
                          CONFIDENCE
                        </span>

                        <strong>
                          {
                            scan.confidenceScore ??
                            0
                          }
                          %
                        </strong>
                      </div>

                      <div className="history-field">
                        <span>
                          VERDICT
                        </span>

                        <strong>
                          {
                            verdict
                          }
                        </strong>
                      </div>

                      <div className="history-field full-width">
                        <span>
                          TARGET /
                          SOURCE
                        </span>

                        <p>
                          {scan.url ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    {scan.summary && (
                      <div className="history-section">
                        <h4>
                          ANALYSIS
                          SUMMARY
                        </h4>

                        <p>
                          {
                            scan.summary
                          }
                        </p>
                      </div>
                    )}

                    {Array.isArray(
                      scan.threats
                    ) &&
                      scan.threats
                        .length >
                        0 && (
                        <div className="history-section">
                          <h4>
                            DETECTED
                            THREATS
                          </h4>

                          <ul>
                            {scan.threats.map(
                              (
                                threat,
                                i
                              ) => (
                                <li
                                  key={
                                    i
                                  }
                                >
                                  {
                                    threat
                                  }
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    <div className="history-date">
                      ◷ Scanned:{" "}
                      {formatDate(
                        scan.createdAt
                      )}
                    </div>
                   {/* =========================================
    DELETE SCAN
========================================= */}

<div className="history-actions">

  <button
    type="button"
    className="delete-history-btn"
    onClick={() =>
      handleDeleteScan(scan._id)
    }
    disabled={
      deletingId === scan._id
    }
  >
    {deletingId === scan._id
      ? "DELETING..."
      : "🗑 DELETE SCAN"}
  </button>

</div> 
                  </article>
                );
              }
            )}
          </div>
        )}
    </main>
  );
}

/* =========================================================
   ABOUT
========================================================= */

function AboutPage({
  onLogin,
  loggedIn,
}) {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-shield">
          🛡
        </div>

        <p className="about-kicker">
          THREATWATCH //
          CYBERSECURITY
          PLATFORM
        </p>

        <h1>
          THREATWATCH{" "}
          <span>AI</span>
        </h1>

        <p className="about-main-text">
          AI-powered
          cybersecurity platform
          designed to analyze
          suspicious URLs, text,
          claims, and images for
          potentially dangerous or
          misleading content.
        </p>

        <button
          className="about-login-button"
          onClick={onLogin}
        >
          <span>⇥</span>

          <strong>
            {loggedIn
              ? "OPEN SECURITY DASHBOARD"
              : "LOGIN / REGISTER"}
          </strong>
        </button>

        <p className="about-login-hint">
          {loggedIn
            ? "Your secure session is active."
            : "Login or create an account to access the security dashboard."}
        </p>
      </section>

      <section className="about-card">
        <div className="section-heading">
          <span>
            THREATWATCH //
          </span>

          <h2>
            HOW TO USE
            THREATWATCH AI
          </h2>
        </div>

        <div className="about-steps">
          <div className="about-step">
            <span>01</span>

            <div>
              <h3>
                LOGIN OR REGISTER
              </h3>

              <p>
                Create a secure
                account or login
                to your existing
                account.
              </p>
            </div>
          </div>

          <div className="about-step">
            <span>02</span>

            <div>
              <h3>
                CHOOSE SCANNER
              </h3>

              <p>
                Select URL, Text,
                or Image security
                analysis.
              </p>
            </div>
          </div>

          <div className="about-step">
            <span>03</span>

            <div>
              <h3>
                GET AI RESULTS
              </h3>

              <p>
                Receive risk score,
                verdict, confidence,
                and analysis.
              </p>
            </div>
          </div>

          <div className="about-step">
            <span>04</span>

            <div>
              <h3>
                REVIEW HISTORY
              </h3>

              <p>
                Search and filter
                your previous
                security scans.
              </p>
            </div>
          </div>
        </div>
      </section>

      <h2 className="feature-title">
        OUR 3 CORE FEATURES
      </h2>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            ↗
          </div>

          <h3>
            URL THREAT
            SCANNER
          </h3>

          <p>
            Analyze website links
            for phishing, scams,
            suspicious domains,
            and dangerous
            characteristics.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            Aa
          </div>

          <h3>
            TEXT / CLAIM
            ANALYZER
          </h3>

          <p>
            Analyze messages,
            claims, deceptive
            language, fraud
            indicators, and
            suspicious information.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            ◫
          </div>

          <h3>
            IMAGE THREAT
            SCANNER
          </h3>

          <p>
            Upload screenshots
            or images for
            AI-powered
            cybersecurity
            analysis.
          </p>
        </div>
      </section>

      <section className="about-final-cta">
        <div>
          <span>
            THREATWATCH AI //
          </span>

          <h2>
            READY TO PROTECT
            YOUR DIGITAL
            SPACE?
          </h2>

          <p>
            Login now and start
            analyzing suspicious
            digital content.
          </p>
        </div>

        <button
          className="about-login-button bottom-login-button"
          onClick={onLogin}
        >
          <span>⇥</span>

          <strong>
            {loggedIn
              ? "OPEN DASHBOARD"
              : "LOGIN / REGISTER"}
          </strong>
        </button>
      </section>
    </main>
  );
}

/* =========================================================
   MODERATOR DASHBOARD
========================================================= */

function ModeratorPage({
  realtimeTick,
}) {
  const [scans, setScans] =
    useState([]);

    const [flaggedScans, setFlaggedScans] = useState([]);

  const [stats, setStats] =
    useState({
      scans: 0,
      safe: 0,
      threats: 0,
      uncertain: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");
    const [flaggingScanId, setFlaggingScanId] =
  useState(null);

const [flagReason, setFlagReason] =
  useState("");

  // =====================================================
// FLAG SCAN AS THREAT
// =====================================================

const handleFlagScan = async (scanId) => {
  const reason = window.prompt(
    "🚩 Why are you flagging this scan as a threat?"
  );

  // User cancelled
  if (reason === null) {
    return;
  }

  const cleanReason = reason.trim();

  if (!cleanReason) {
    alert(
      "Please enter a reason before flagging the scan."
    );
    return;
  }

  const token = getToken();

  if (!token) {
    setError(
      "Authentication token not found."
    );
    return;
  }

  try {
    setFlaggingScanId(scanId);
    setError("");

    const response = await fetch(
      `${API_URL}/api/moderator/scans/${scanId}/flag`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          reason: cleanReason,
        }),
      }
    );

    const data =
      await readResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to flag scan."
      );
    }

    // Update scan immediately
    setScans((previousScans) =>
      previousScans.map((scan) =>
        scan._id === scanId
          ? {
              ...scan,
              isFlagged: true,
              flagReason: cleanReason,
              flaggedAt:
                new Date().toISOString(),
            }
          : scan
      )
    );

    alert(
      "🚩 Scan flagged successfully."
    );

  } catch (err) {
    console.error(
      "FLAG SCAN ERROR:",
      err
    );

    setError(
      err.message ||
        "Unable to flag scan."
    );

  } finally {
    setFlaggingScanId(null);
  }
};
  const loadModeratorData =
    async () => {
      const token =
        getToken();

      if (!token) {
        setError(
          "Authentication token not found."
        );

        setLoading(false);

        return;
      }

      setLoading(true);
      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept:
            "application/json",
        };

        const [
          scansResponse,
          statsResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/api/moderator/scans`,
              {
                headers,
              }
            ),

            fetch(
              `${API_URL}/api/moderator/stats`,
              {
                headers,
              }
            ),
          ]);

        const scansData =
          await readResponse(
            scansResponse
          );

        const statsData =
          await readResponse(
            statsResponse
          );

        /*
          IMPORTANT:
          Your backend returns:
          {
            success: true,
            count: ...,
            scans: [...]
          }

          So we correctly read scansData.scans.
        */

        if (
          !scansResponse.ok
        ) {
          throw new Error(
            scansData.message ||
              scansData.details ||
              "Moderator scans API is unavailable."
          );
        }

        if (
          !statsResponse.ok
        ) {
          throw new Error(
            statsData.message ||
              statsData.details ||
              "Moderator statistics API is unavailable."
          );
        }

        const list =
          Array.isArray(
            scansData
          )
            ? scansData
            : Array.isArray(
                scansData.scans
              )
            ? scansData.scans
            : [];

        const orderedScans =
          [...list].sort(
            (a, b) =>
              new Date(
                b.createdAt ||
                  0
              ) -
              new Date(
                a.createdAt ||
                  0
              )
          );

        setScans(
          orderedScans
        );
        const flagsArray = orderedScans.filter(
  (scan) =>
    scan.flagged === true ||
    scan.isFlagged === true ||
    scan.verdict === "THREAT"
);

setFlaggedScans(flagsArray);

        setStats({
          scans:
            statsData?.scans
              ?.total ??
            orderedScans.length,

          safe:
            statsData?.results
              ?.safe ??
            orderedScans.filter(
              (scan) =>
                getVerdict(
                  scan
                ) ===
                "SAFE"
            ).length,

          threats:
            statsData?.results
              ?.threats ??
            orderedScans.filter(
              (scan) =>
                getVerdict(
                  scan
                ) ===
                "THREAT"
            ).length,

          uncertain:
            statsData?.results
              ?.uncertain ??
            orderedScans.filter(
              (scan) =>
                getVerdict(
                  scan
                ) ===
                "UNCERTAIN"
            ).length,
        });

        setError("");
      } catch (err) {
        console.error(
          "MODERATOR DASHBOARD ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load moderator data."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadModeratorData();
  }, [realtimeTick]);

  const filtered =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase();

      return scans.filter(
        (scan) => {
          const searchable =
            `${scan.url || ""} ${
              scan.summary ||
              ""
            } ${getVerdict(
              scan
            )} ${getScanType(
              scan
            )} ${getUserEmail(
              scan
            )}`.toLowerCase();

          return (
            !q ||
            searchable.includes(
              q
            )
          );
        }
      );
    }, [
      scans,
      query,
    ]);

  return (
    <main className="admin-page moderator-page">
      <section className="admin-hero">
        <div>
          <div className="admin-kicker">
            <span className="admin-live-dot" />

            THREATWATCH //
            MODERATOR CONTROL
          </div>

          <h1>
            MODERATOR{" "}
            <span>
              DASHBOARD
            </span>
          </h1>

          <p>
            Monitor verification
            activity and review
            security results.
          </p>
        </div>

        <div className="admin-status">
          <span className="status-icon">
            ◈
          </span>

          <div>
            <strong>
              MODERATOR ACCESS
            </strong>

            <small>
              ROLE-BASED CONTROL
            </small>
          </div>
        </div>
      </section>

      {error && (
        <div className="admin-error">
          <span>⚠</span>

          <div>
            <strong>
              MODERATOR API ERROR
            </strong>

            <p>
              {error}
            </p>

            <small>
              Check that the
              backend is running
              on port 5001 and
              that
              /api/moderator
              is registered.
            </small>
          </div>
        </div>
      )}

      <section className="admin-stats">
        <div className="admin-stat-card scans-stat">
          <div className="admin-stat-icon">
            ◉
          </div>

          <div>
            <span>
              TOTAL SCANS
            </span>

            <strong>
              {stats.scans}
            </strong>

            <small>
              SECURITY RECORDS
            </small>
          </div>
        </div>

        <div className="admin-stat-card safe-stat">
          <div className="admin-stat-icon">
            ✓
          </div>

          <div>
            <span>
              SAFE
            </span>

            <strong>
              {stats.safe}
            </strong>

            <small>
              VERIFIED RESULTS
            </small>
          </div>
        </div>

        <div className="admin-stat-card threat-stat">
          <div className="admin-stat-icon">
            !
          </div>

          <div>
            <span>
              THREATS
            </span>

            <strong>
              {stats.threats}
            </strong>

            <small>
              FLAGGED RESULTS
            </small>
          </div>
        </div>

        <div className="admin-stat-card users-stat">
          <div className="admin-stat-icon">
            ◌
          </div>

          <div>
            <span>
              UNCERTAIN
            </span>

            <strong>
              {stats.uncertain}
            </strong>

            <small>
              NEEDS REVIEW
            </small>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <span className="panel-icon">
              🛡
            </span>

            <div>
              <h2>
                SECURITY MONITOR
              </h2>

              <p>
                Live verification
                activity
              </p>
            </div>
          </div>

          <span className="panel-count">
            {filtered.length}{" "}
            RECORDS
          </span>
        </div>

        <div className="history-toolbar">
          <input
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search scans..."
          />

          <button
            className="history-refresh"
            onClick={
              loadModeratorData
            }
            disabled={
              loading
            }
          >
            {loading
              ? "LOADING..."
              : "↻ REFRESH"}
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">
            ◌ LOADING
            SECURITY
            RECORDS...
          </div>
        ) : filtered.length ===
          0 ? (
          <div className="admin-empty">
            ◎ NO RECORDS FOUND
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table scans-table">
              <thead>
                <tr>
                  <th>
                    #
                  </th>

                  <th>
                    TYPE
                  </th>

                  <th>
                    USER
                  </th>

                  <th>
                    RISK
                  </th>

                  <th>
                    VERDICT
                  </th>

                  <th>
                    DATE
                  </th>
                  <th>
  ACTION
</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (
                    scan,
                    index
                  ) => {
                    const verdict =
                      getVerdict(
                        scan
                      );

                    return (
                      <tr
                        key={
                          scan._id ||
                          index
                        }
                      >
                        <td>
                          <span className="row-number">
                            {index +
                              1}
                          </span>
                        </td>

                        <td>
                          <span className="scan-type">
                            {getScanType(
                              scan
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className="scan-user"
                            title={getUserEmail(
                              scan
                            )}
                          >
                            {getUserEmail(
                              scan
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`risk-value risk-${verdict.toLowerCase()}`}
                          >
                            {scan.riskScore ??
                              0}
                            %
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${verdict.toLowerCase()}`}
                          >
                            {
                              verdict
                            }
                          </span>
                        </td>

                        <td>
                          <span className="date-cell">
                            ◷{" "}
                            {formatDate(
                              scan.createdAt
                            )}
                          </span>
                        </td>
                        <td>
  {scan.isFlagged ? (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        border: "1px solid #ff3c5a",
        borderRadius: "7px",
        color: "#ff3c5a",
        background:
          "rgba(255,60,90,.10)",
        fontSize: "11px",
        fontWeight: "bold",
        fontFamily:
          '"Courier New", monospace',
      }}
      title={
        scan.flagReason ||
        "Flagged by moderator"
      }
    >
      🚩 FLAGGED
    </span>
  ) : (
    <button
      type="button"
      onClick={() =>
        handleFlagScan(scan._id)
      }
      disabled={
        flaggingScanId === scan._id
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 12px",
        minWidth: "105px",
        background:
          "rgba(255,60,90,.10)",
        color: "#ff3c5a",
        border:
          "1px solid #ff3c5a",
        borderRadius: "7px",
        fontFamily:
          '"Courier New", monospace',
        fontSize: "11px",
        fontWeight: "bold",
        cursor:
          flaggingScanId ===
          scan._id
            ? "not-allowed"
            : "pointer",
      }}
    >
      {flaggingScanId === scan._id
        ? "FLAGGING..."
        : "🚩 FLAG THREAT"}
    </button>
  )}
</td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [flaggedScans, setFlaggedScans] = useState([]);
const [flagsLoading, setFlagsLoading] = useState(false);
const [flagsError, setFlagsError] = useState("");

  const [stats, setStats] = useState({
    users: 0,
    scans: 0,
    safe: 0,
    threats: 0,
    uncertain: 0,
  });


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [scanSearch, setScanSearch] = useState("");
  const [scanFilter, setScanFilter] = useState("ALL");
  const [deletingUserId, setDeletingUserId] = useState(null);
const [deletingScanId, setDeletingScanId] = useState(null);

/* =====================================================
   DELETE USER
===================================================== */

const handleDeleteUser = async (userId) => {
  const confirmed = window.confirm(
    "⚠️ Are you sure you want to delete this user and all of their scan history?"
  );

  if (!confirmed) return;

  const token = getToken();

  if (!token) {
    setError("Authentication token not found.");
    return;
  }

  try {
    setDeletingUserId(userId);
    setError("");

    const response = await fetch(
      `${API_URL}/api/admin/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete user."
      );
    }

    // Remove user immediately from UI
    setUsers((previousUsers) =>
      previousUsers.filter(
        (user) => user._id !== userId
      )
    );

    // Update user count
    setStats((previousStats) => ({
      ...previousStats,
      users: Math.max(
        0,
        previousStats.users - 1
      ),
    }));

    console.log("✅ User deleted:", userId);

  } catch (err) {
    console.error(
      "DELETE USER ERROR:",
      err
    );

    setError(
      err.message ||
        "Unable to delete user."
    );

  } finally {
    setDeletingUserId(null);
  }
};


/* =====================================================
   DELETE SCAN
===================================================== */

const handleDeleteScan = async (scanId) => {
  const confirmed = window.confirm(
    "⚠️ Are you sure you want to delete this scan?"
  );

  if (!confirmed) return;

  const token = getToken();

  if (!token) {
    setError("Authentication token not found.");
    return;
  }

  try {
    setDeletingScanId(scanId);
    setError("");

    const response = await fetch(
      `${API_URL}/api/admin/scans/${scanId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete scan."
      );
    }

    // Remove scan immediately from UI
    setScans((previousScans) =>
      previousScans.filter(
        (scan) => scan._id !== scanId
      )
    );

    // Update scan statistics
    setStats((previousStats) => ({
      ...previousStats,
      scans: Math.max(
        0,
        previousStats.scans - 1
      ),
    }));

    console.log("✅ Scan deleted:", scanId);

  } catch (err) {
    console.error(
      "DELETE SCAN ERROR:",
      err
    );

    setError(
      err.message ||
        "Unable to delete scan."
    );

  } finally {
    setDeletingScanId(null);
  }
};

  /* =====================================================
     LOAD ADMIN DATA
  ===================================================== */

  const loadAdminData = async () => {
    const token = getToken();

    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [
        usersResponse,
        scansResponse,
        statsResponse,
        flagsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, {
          headers,
        }),

        fetch(`${API_URL}/api/admin/scans`, {
          headers,
        }),

        fetch(`${API_URL}/api/admin/stats`, {
          headers,
        }),

        fetch(`${API_URL}/api/moderator/flags`, {
    headers,
  }),
      ]);

      const usersData = await readResponse(
        usersResponse
      );

      const scansData = await readResponse(
        scansResponse
      );

      const statsData = await readResponse(
        statsResponse
      );
const flagsData =
  await readResponse(
    flagsResponse
  );


      if (!usersResponse.ok) {
        throw new Error(
          usersData.message ||
            "Could not load registered users."
        );
      }

      if (!scansResponse.ok) {
        throw new Error(
          scansData.message ||
            "Could not load security scans."
        );
      }

      if (!statsResponse.ok) {
        throw new Error(
          statsData.message ||
            "Could not load admin statistics."
        );
      }
      if (!flagsResponse.ok) {
  throw new Error(
    flagsData.message ||
      "Could not load flags threats."
  );
}

      const usersArray = Array.isArray(usersData)
        ? usersData
        : usersData.users || [];

      const scansArray = Array.isArray(scansData)
        ? scansData
        : scansData.scans || [];

      const orderedUsers = [...usersArray].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      const orderedScans = [...scansArray].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      /* -------------------------------------------------
         Calculate fallback statistics from scans
      ------------------------------------------------- */

      const safeCount = orderedScans.filter(
        (scan) => getVerdict(scan) === "SAFE"
      ).length;

      const threatCount = orderedScans.filter(
        (scan) => getVerdict(scan) === "THREAT"
      ).length;

      const uncertainCount = orderedScans.filter(
        (scan) => getVerdict(scan) === "UNCERTAIN"
      ).length;

      setUsers(orderedUsers);
      setScans(orderedScans);

      const flagsArray =
  Array.isArray(flagsData)
    ? flagsData
    : flagsData.flags || [];

setFlaggedScans(flagsArray);

      setStats({
        users:
          statsData?.users?.total ??
          orderedUsers.length,

        scans:
          statsData?.scans?.total ??
          orderedScans.length,

        safe:
          statsData?.results?.safe ??
          safeCount,

        threats:
          statsData?.results?.threats ??
          threatCount,

        uncertain:
          statsData?.results?.uncertain ??
          uncertainCount,
      });
    } catch (err) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load admin data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  /* =====================================================
     PERCENTAGES
  ===================================================== */

  const safePercentage =
    stats.scans > 0
      ? Math.round(
          (stats.safe / stats.scans) * 100
        )
      : 0;

  const threatPercentage =
    stats.scans > 0
      ? Math.round(
          (stats.threats / stats.scans) * 100
        )
      : 0;

  const uncertainPercentage =
    stats.scans > 0
      ? Math.round(
          (stats.uncertain / stats.scans) * 100
        )
      : 0;

  /* =====================================================
     FILTER USERS
  ===================================================== */

  const filteredUsers = useMemo(() => {
    const query = userSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const searchable =
        `${user.name || ""} ${
          user.email || ""
        } ${user.role || ""}`.toLowerCase();

      return searchable.includes(query);
    });
  }, [users, userSearch]);

  /* =====================================================
     FILTER SCANS
  ===================================================== */

  const filteredScans = useMemo(() => {
    const query = scanSearch
      .trim()
      .toLowerCase();

    return scans.filter((scan) => {
      const verdict = getVerdict(scan);
      const type = getScanType(scan);

      const searchable =
        `${scan.url || ""} ${
          scan.summary || ""
        } ${getUserEmail(scan)} ${
          verdict
        } ${type}`.toLowerCase();

      const matchesSearch =
        !query ||
        searchable.includes(query);

      const matchesFilter =
        scanFilter === "ALL" ||
        verdict === scanFilter ||
        type === scanFilter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    scans,
    scanSearch,
    scanFilter,
  ]);

  /* =====================================================
     HIGH RISK SCANS
  ===================================================== */

  const highRiskScans = useMemo(() => {
    return [...scans]
      .filter(
        (scan) =>
          Number(scan.riskScore || 0) >= 70
      )
      .slice(0, 5);
  }, [scans]);

  /* =====================================================
     RECENT SCANS
  ===================================================== */

  const recentScans = scans.slice(0, 5);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main
      className="admin-page"
      style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: "1250px",
        margin: "0 auto",
        padding: "35px 20px 60px",
        boxSizing: "border-box",
      }}
    >

      {/* =================================================
          HERO
      ================================================= */}

      <section className="admin-hero">
        <div>
          <p className="admin-kicker">
            THREATWATCH //
            ADMINISTRATOR CONTROL
          </p>

          <h1>
            ADMIN{" "}
            <span>DASHBOARD</span>
          </h1>

          <p>
            Monitor users, security
            scans, threats and
            verification activity
            across the ThreatWatch AI
            platform.
          </p>
        </div>

        <div className="admin-status">
          <span className="green-dot" />

          ADMIN ACCESS
        </div>
      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="admin-error">
          <strong>
            ADMIN API ERROR
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          ◌ LOADING ADMIN
          CONTROL PANEL...
        </div>
      ) : (
        <>
          {/* =================================================
              MAIN STATISTICS
          ================================================= */}

          <section className="admin-stats">

            <div className="admin-stat-card scans-stat">
              <div className="admin-stat-icon">
                ◉
              </div>

              <div>
                <span>
                  TOTAL SCANS
                </span>

                <strong>
                  {stats.scans}
                </strong>

                <small>
                  ALL SECURITY ANALYSIS
                </small>
              </div>
            </div>

            <div className="admin-stat-card safe-stat">
              <div className="admin-stat-icon">
                ✓
              </div>

              <div>
                <span>
                  SAFE SCANS
                </span>

                <strong>
                  {stats.safe}
                </strong>

                <small>
                  {safePercentage}% OF SCANS
                </small>
              </div>
            </div>

            <div className="admin-stat-card threat-stat">
              <div className="admin-stat-icon">
                !
              </div>

              <div>
                <span>
                  THREATS
                </span>

                <strong>
                  {stats.threats}
                </strong>

                <small>
                  {threatPercentage}% OF SCANS
                </small>
              </div>
            </div>

            <div className="admin-stat-card users-stat">
              <div className="admin-stat-icon">
                👥
              </div>

              <div>
                <span>
                  TOTAL USERS
                </span>

                <strong>
                  {stats.users}
                </strong>

                <small>
                  REGISTERED ACCOUNTS
                </small>
              </div>
            </div>

          </section>

          {/* =================================================
              SECONDARY STATISTICS
          ================================================= */}

          <section
            className="admin-stats"
            style={{
              marginTop: "18px",
            }}
          >

            <div className="admin-stat-card">
              <div className="admin-stat-icon">
                ?
              </div>

              <div>
                <span>
                  UNCERTAIN
                </span>

                <strong>
                  {stats.uncertain}
                </strong>

                <small>
                  {uncertainPercentage}%
                  NEED REVIEW
                </small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">
                ↗
              </div>

              <div>
                <span>
                  URL SCANS
                </span>

                <strong>
                  {
                    scans.filter(
                      (scan) =>
                        getScanType(scan) ===
                        "URL"
                    ).length
                  }
                </strong>

                <small>
                  WEBSITE ANALYSIS
                </small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">
                Aa
              </div>

              <div>
                <span>
                  TEXT SCANS
                </span>

                <strong>
                  {
                    scans.filter(
                      (scan) =>
                        getScanType(scan) ===
                        "TEXT"
                    ).length
                  }
                </strong>

                <small>
                  CLAIM ANALYSIS
                </small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">
                ◫
              </div>

              <div>
                <span>
                  IMAGE SCANS
                </span>

                <strong>
                  {
                    scans.filter(
                      (scan) =>
                        getScanType(scan) ===
                        "IMAGE"
                    ).length
                  }
                </strong>

                <small>
                  IMAGE ANALYSIS
                </small>
              </div>
            </div>

          </section>

          {/* =================================================
              SECURITY ANALYTICS
          ================================================= */}

          <section className="admin-panel">

            <div className="admin-panel-header">
              <div>
                <h2>
                  SECURITY ANALYTICS
                </h2>

                <p>
                  Overall verification
                  result distribution
                </p>
              </div>

              <span>
                {stats.scans} TOTAL
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                padding: "20px 0",
              }}
            >

              {/* SAFE */}

              <div
                style={{
                  padding: "20px",
                  border:
                    "1px solid rgba(0,255,150,.25)",
                  background:
                    "rgba(0,255,150,.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    SAFE
                  </strong>

                  <span>
                    {safePercentage}%
                  </span>
                </div>

                <div
                  style={{
                    height: "8px",
                    background:
                      "rgba(255,255,255,.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width:
                        `${safePercentage}%`,
                      height: "100%",
                      background:
                        "#00ff9d",
                    }}
                  />
                </div>
              </div>

              {/* THREAT */}

              <div
                style={{
                  padding: "20px",
                  border:
                    "1px solid rgba(255,60,90,.25)",
                  background:
                    "rgba(255,60,90,.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    THREATS
                  </strong>

                  <span>
                    {threatPercentage}%
                  </span>
                </div>

                <div
                  style={{
                    height: "8px",
                    background:
                      "rgba(255,255,255,.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width:
                        `${threatPercentage}%`,
                      height: "100%",
                      background:
                        "#ff3c5a",
                    }}
                  />
                </div>
              </div>

              {/* UNCERTAIN */}

              <div
                style={{
                  padding: "20px",
                  border:
                    "1px solid rgba(255,190,50,.25)",
                  background:
                    "rgba(255,190,50,.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    UNCERTAIN
                  </strong>

                  <span>
                    {uncertainPercentage}%
                  </span>
                </div>

                <div
                  style={{
                    height: "8px",
                    background:
                      "rgba(255,255,255,.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width:
                        `${uncertainPercentage}%`,
                      height: "100%",
                      background:
                        "#ffbe32",
                    }}
                  />
                </div>
              </div>

            </div>
          </section>

          {/* =================================================
              HIGH RISK THREAT MONITOR
          ================================================= */}

          <section className="admin-panel">

            <div className="admin-panel-header">
              <div>
                <h2>
                  🚨 HIGH-RISK THREAT MONITOR
                </h2>

                <p>
                  Security scans with
                  risk score 70% or higher
                </p>
              </div>

              <span>
                {highRiskScans.length}
                {" "}HIGH RISK
              </span>
            </div>

            {highRiskScans.length === 0 ? (
              <div className="admin-empty">
                ✓ NO HIGH-RISK THREATS
                DETECTED
              </div>
            ) : (
              <div
                className="admin-table-wrapper"
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>TYPE</th>
                      <th>USER</th>
                      <th>TARGET</th>
                      <th>RISK</th>
                      <th>VERDICT</th>
                    </tr>
                  </thead>

                  <tbody>
                    {highRiskScans.map(
                      (scan, index) => {
                        const verdict =
                          getVerdict(scan);

                        return (
                          <tr
                            key={
                              scan._id ||
                              `high-${index}`
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {getScanType(
                                scan
                              )}
                            </td>

                            <td>
                              {getUserEmail(
                                scan
                              )}
                            </td>

                            <td
                              title={
                                scan.url ||
                                ""
                              }
                            >
                              {scan.url ||
                                "N/A"}
                            </td>

                            <td>
                              <strong
                                style={{
                                  color:
                                    "#ff3c5a",
                                }}
                              >
                                {scan.riskScore ??
                                  0}
                                %
                              </strong>
                            </td>

                            <td>
                              <span className="admin-threat">
                                {verdict}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
{/* =================================================
    MODERATOR FLAGGED THREATS
================================================= */}

<section className="admin-panel">

  <div className="admin-panel-header">
    <div>
      <h2>
        🚩 MODERATOR FLAGGED THREATS
      </h2>

      <p>
        Threats manually flagged by moderators
      </p>
    </div>

    <span>
      {flaggedScans.length} FLAGGED
    </span>
  </div>

  {flaggedScans.length === 0 ? (
    <div className="admin-empty">
      ✓ NO MODERATOR FLAGS
    </div>
  ) : (
    <div
      className="admin-table-wrapper"
      style={{
        overflowX: "auto",
      }}
    >
      <table className="admin-table">

        <thead>
          <tr>
            <th>#</th>
            <th>TYPE</th>
            <th>USER</th>
            <th>TARGET</th>
            <th>RISK</th>
            <th>FLAGGED BY</th>
            <th>REASON</th>
            <th>DATE</th>
          </tr>
        </thead>

        <tbody>
          {flaggedScans.map(
            (scan, index) => (
              <tr
                key={
                  scan._id ||
                  `flag-${index}`
                }
              >

                <td>
                  {index + 1}
                </td>

                <td>
                  <span className="scan-type">
                    {getScanType(scan)}
                  </span>
                </td>

                <td>
                  {getUserEmail(scan)}
                </td>

                <td
                  title={
                    scan.url || ""
                  }
                  style={{
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {scan.url || "N/A"}
                </td>

                <td>
                  <strong
                    style={{
                      color: "#ff3c5a",
                    }}
                  >
                    {scan.riskScore ?? 0}%
                  </strong>
                </td>

                <td>
                  {scan.flaggedBy?.name ||
                    scan.flaggedBy?.email ||
                    "Moderator"}
                </td>

                <td
                  title={
                    scan.flagReason || ""
                  }
                >
                  {scan.flagReason ||
                    "Threat flagged"}
                </td>

                <td>
                  {formatDate(
                    scan.flaggedAt
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


          {/* =================================================
              RECENT SECURITY ACTIVITY
          ================================================= */}

          <section className="admin-panel">

            <div className="admin-panel-header">
              <div>
                <h2>
                  RECENT SECURITY ACTIVITY
                </h2>

                <p>
                  Latest verification
                  activity
                </p>
              </div>

              <span>
                LAST {recentScans.length}
              </span>
            </div>

            {recentScans.length === 0 ? (
              <div className="admin-empty">
                NO RECENT SCANS
              </div>
            ) : (
              <div
                className="admin-table-wrapper"
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>TYPE</th>
                      <th>USER</th>
                      <th>RISK</th>
                      <th>VERDICT</th>
                      <th>DATE</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentScans.map(
                      (scan, index) => {
                        const verdict =
                          getVerdict(scan);

                        return (
                          <tr
                            key={
                              scan._id ||
                              `recent-${index}`
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {getScanType(
                                scan
                              )}
                            </td>

                            <td>
                              {getUserEmail(
                                scan
                              )}
                            </td>

                            <td>
                              {scan.riskScore ??
                                0}
                              %
                            </td>

                            <td>
                              <span
                                className={
                                  verdict ===
                                  "SAFE"
                                    ? "admin-safe"
                                    : verdict ===
                                      "THREAT"
                                    ? "admin-threat"
                                    : "admin-uncertain"
                                }
                              >
                                {verdict}
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                scan.createdAt
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =================================================
              REGISTERED USERS
          ================================================= */}

          <section className="admin-panel">

            <div className="admin-panel-header">
              <div>
                <h2>
                  REGISTERED USERS
                </h2>

                <p>
                  All accounts registered
                  on ThreatWatch AI
                </p>
              </div>

              <span>
                {filteredUsers.length}
                {" "}USERS
              </span>
            </div>

            <div
              className="history-toolbar"
              style={{
                marginBottom: "20px",
              }}
            >
              <input
                value={userSearch}
                onChange={(e) =>
                  setUserSearch(
                    e.target.value
                  )
                }
                placeholder="Search name, email or role..."
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="admin-empty">
                NO USERS FOUND
              </div>
            ) : (
              <div
                className="admin-table-wrapper"
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>REGISTERED</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(
                      (item, index) => {
                        const role =
                          String(
                            item.role ||
                              "User"
                          )
                            .trim()
                            .toLowerCase();

                        return (
                          <tr
                            key={
                              item._id ||
                              item.id ||
                              `user-${index}`
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {item.name ||
                                "N/A"}
                            </td>

                            <td
                              title={
                                item.email ||
                                ""
                              }
                            >
                              {item.email ||
                                "N/A"}
                            </td>

                           <td>
  <select
    value={item.role || "User"}
    onChange={(e) =>
      handleRoleChange(
        item._id || item.id,
        e.target.value
      )
    }
    disabled={
      (item._id || item.id) ===
      getSavedUser()?._id
    }
    className="role-select"
  >
    <option value="User">
      User
    </option>

    <option value="Moderator">
      Moderator
    </option>

    <option value="Admin">
      Admin
    </option>
  </select>
</td>
                            <td>
                              {formatDate(
                                item.createdAt
                              )}
                            </td>
                            <td>
  {role === "admin" ? (
    <span
      style={{
        color: "#888",
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      PROTECTED
    </span>
  ) : (
    <button
      type="button"
      onClick={() =>
        handleDeleteUser(
          item._id || item.id
        )
      }
      disabled={
        deletingUserId ===
        (item._id || item.id)
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "9px 16px",
        minWidth: "90px",
        background:
          "rgba(255, 23, 68, 0.15)",
        color: "#ff1744",
        border:
          "1px solid #ff1744",
        borderRadius: "7px",
        fontFamily:
          '"Courier New", monospace',
        fontSize: "12px",
        fontWeight: "bold",
        cursor:
          deletingUserId ===
          (item._id || item.id)
            ? "not-allowed"
            : "pointer",
      }}
    >
      {deletingUserId ===
      (item._id || item.id)
        ? "DELETING..."
        : "🗑 DELETE"}
    </button>
  )}
</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =================================================
    MODERATOR THREAT FLAGS
================================================= */}

<section className="admin-panel">

  <div className="admin-panel-header">
    <div>
      <h2>
        🚩 MODERATOR THREAT FLAGS
      </h2>

      <p>
        Threats reported by moderators
        for administrator review
      </p>
    </div>

    <span>
      {flaggedScans.length} FLAGS
    </span>
  </div>

  {flaggedScans.length === 0 ? (
    <div className="admin-empty">
      ✓ NO MODERATOR FLAGS
    </div>
  ) : (
    <div
      className="admin-table-wrapper"
      style={{
        overflowX: "auto",
      }}
    >
      <table className="admin-table">

        <thead>
          <tr>
            <th>#</th>
            <th>MODERATOR</th>
            <th>USER</th>
            <th>TYPE</th>
            <th>TARGET</th>
            <th>RISK</th>
            <th>VERDICT</th>
            <th>REASON</th>
            <th>FLAGGED</th>
          </tr>
        </thead>

        <tbody>
          {flaggedScans.map(
            (scan, index) => {

              const moderator =
                scan.flaggedBy;

              const user =
                scan.user;

              return (
                <tr
                  key={
                    scan._id ||
                    `flag-${index}`
                  }
                >

                  <td>
                    {index + 1}
                  </td>

                  <td>
                    <strong>
                      {moderator?.name ||
                        "Unknown"}
                    </strong>

                    <br />

                    <small>
                      {moderator?.email ||
                        "N/A"}
                    </small>
                  </td>

                  <td>
                    {user?.email ||
                      "N/A"}
                  </td>

                  <td>
                    <span className="scan-type">
                      {getScanType(scan)}
                    </span>
                  </td>

                  <td
                    title={
                      scan.url || ""
                    }
                    style={{
                      maxWidth: "220px",
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis",
                    }}
                  >
                    {scan.url ||
                      "N/A"}
                  </td>

                  <td>
                    <strong
                      style={{
                        color:
                          "#ff3c5a",
                      }}
                    >
                      {scan.riskScore ?? 0}%
                    </strong>
                  </td>

                  <td>
                    <span className="admin-threat">
                      {getVerdict(scan)}
                    </span>
                  </td>

                  <td
                    title={
                      scan.flagReason ||
                      ""
                    }
                    style={{
                      maxWidth: "260px",
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis",
                    }}
                  >
                    {scan.flagReason ||
                      "No reason provided"}
                  </td>

                  <td>
                    {formatDate(
                      scan.flaggedAt
                    )}
                  </td>

                </tr>
              );
            }
          )}
        </tbody>

      </table>
    </div>
  )}

</section>

          {/* =================================================
              ALL SECURITY SCANS
          ================================================= */}

          <section className="admin-panel">

            <div className="admin-panel-header">
              <div>
                <h2>
                  ALL SECURITY SCANS
                </h2>

                <p>
                  Complete platform-wide
                  security scan records
                </p>
              </div>

              <span>
                {filteredScans.length}
                {" "}RECORDS
              </span>
            </div>

            <div
              className="history-toolbar"
              style={{
                marginBottom: "20px",
              }}
            >
              <input
                value={scanSearch}
                onChange={(e) =>
                  setScanSearch(
                    e.target.value
                  )
                }
                placeholder="Search URL, user, threat, verdict..."
              />

              <select
                value={scanFilter}
                onChange={(e) =>
                  setScanFilter(
                    e.target.value
                  )
                }
              >
                <option value="ALL">
                  ALL RESULTS
                </option>

                <option value="SAFE">
                  SAFE
                </option>

                <option value="THREAT">
                  THREAT
                </option>

                <option value="UNCERTAIN">
                  UNCERTAIN
                </option>

                <option value="URL">
                  URL
                </option>

                <option value="TEXT">
                  TEXT
                </option>

                <option value="IMAGE">
                  IMAGE
                </option>
              </select>
            </div>

            {filteredScans.length === 0 ? (
              <div className="admin-empty">
                NO SCAN RECORDS FOUND
              </div>
            ) : (
              <div
                className="admin-table-wrapper"
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>TYPE</th>
                      <th>USER</th>
                      <th>TARGET</th>
                      <th>RISK</th>
                      <th>VERDICT</th>
                      <th>DATE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredScans.map(
                      (scan, index) => {
                        const verdict =
                          getVerdict(scan);

                        return (
                          <tr
                            key={
                              scan._id ||
                              `scan-${index}`
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              <span className="scan-type">
                                {getScanType(
                                  scan
                                )}
                              </span>
                            </td>

                            <td
                              title={
                                getUserEmail(
                                  scan
                                )
                              }
                            >
                              {getUserEmail(
                                scan
                              )}
                            </td>

                            <td
                              title={
                                scan.url ||
                                ""
                              }
                              style={{
                                maxWidth:
                                  "250px",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                              }}
                            >
                              {scan.url ||
                                "N/A"}
                            </td>

                            <td>
                              <strong>
                                {scan.riskScore ??
                                  0}
                                %
                              </strong>
                            </td>

                            <td>
                              <span
                                className={
                                  verdict ===
                                  "SAFE"
                                    ? "admin-safe"
                                    : verdict ===
                                      "THREAT"
                                    ? "admin-threat"
                                    : "admin-uncertain"
                                }
                              >
                                {verdict}
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                scan.createdAt
                              )}
                            </td>
                            {/* DELETE BUTTON */}
<td>
  <button
    type="button"
    onClick={() =>
      handleDeleteScan(scan._id)
    }
    disabled={
      deletingScanId === scan._id
    }
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "9px 16px",
      minWidth: "90px",
      background:
        "rgba(255, 23, 68, 0.15)",
      color: "#ff1744",
      border:
        "1px solid #ff1744",
      borderRadius: "7px",
      fontFamily:
        '"Courier New", monospace',
      fontSize: "12px",
      fontWeight: "bold",
      cursor:
        deletingScanId === scan._id
          ? "not-allowed"
          : "pointer",
    }}
  >
    {deletingScanId === scan._id
      ? "DELETING..."
      : "🗑 DELETE"}
  </button>
</td>

</tr>
                          
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =================================================
              REFRESH
          ================================================= */}

          <button
            className="admin-refresh"
            onClick={
              loadAdminData
            }
            disabled={loading}
          >
            {loading
              ? "↻ LOADING..."
              : "↻ REFRESH ADMIN DATA"}
          </button>
        </>
      )}
    </main>
  );
}
/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const savedUser =
    getSavedUser();

  const savedToken =
    getToken();

  const [page, setPage] =
    useState("about");

  const [loggedIn, setLoggedIn] =
    useState(
      Boolean(savedToken)
    );

  const [user, setUser] =
    useState(
      savedUser
    );

  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          "theme"
        ) || "dark"
    );

  const [stats, setStats] =
    useState({
      safe: 0,
      threats: 0,
    });

  const [
    realtimeTick,
    setRealtimeTick,
  ] = useState(0);

  const [liveStatus, setLiveStatus] =
    useState(
      "CONNECTING"
    );

  const role =
    normalizeRole(
      user?.role
    );

  const isAdmin =
    role === "admin";

  const isModerator =
    role ===
    "moderator";

  /* =====================================================
     THEME
  ===================================================== */

  useEffect(() => {
    document.documentElement.classList.toggle(
      "light-mode",
      theme === "light"
    );

    document.body.classList.toggle(
      "light-mode",
      theme === "light"
    );

    localStorage.setItem(
      "theme",
      theme
    );
  }, [theme]);

  /* =====================================================
     RESTORE LOGIN SESSION
  ===================================================== */

  useEffect(() => {
    const token =
      getToken();

    const saved =
      getSavedUser();

    if (!token) {
      setLoggedIn(false);
      setUser(null);
      setPage("about");
      return;
    }

    setLoggedIn(true);

    if (saved) {
      setUser(saved);

      /*
        IMPORTANT:
        Restore the correct dashboard
        immediately after page refresh.
      */
      const savedRole =
        normalizeRole(
          saved.role
        );

      if (
        savedRole ===
        "admin"
      ) {
        setPage("admin");
      } else if (
        savedRole ===
        "moderator"
      ) {
        setPage(
          "moderator"
        );
      } else {
        setPage(
          "dashboard"
        );
      }
    }
  }, []);

  /* =====================================================
     SOCKET.IO REAL-TIME STATUS
  ===================================================== */

  useEffect(() => {
    if (
      !loggedIn ||
      !getToken()
    ) {
      setLiveStatus(
        "OFFLINE"
      );

      return;
    }

    let socket;

    try {
      setLiveStatus(
        "CONNECTING"
      );

      socket = io(
        API_URL,
        {
          auth: {
            token:
              getToken(),
          },

          transports: [
            "websocket",
            "polling",
          ],

          reconnection: true,

          reconnectionAttempts:
            10,

          reconnectionDelay:
            1500,
        }
      );

      socket.on(
        "connect",
        () => {
          setLiveStatus(
            "LIVE"
          );
        }
      );

      socket.on(
        "disconnect",
        () => {
          setLiveStatus(
            "OFFLINE"
          );
        }
      );

      socket.on(
        "connect_error",
        (error) => {
          console.error(
            "SOCKET CONNECTION ERROR:",
            error.message
          );

          setLiveStatus(
            "RETRYING"
          );
        }
      );

      const refreshFromSocket =
        () => {
          setRealtimeTick(
            (value) =>
              value + 1
          );
        };

      [
        "scan:created",
        "scanCreated",
        "scan:completed",
        "scanCompleted",
        "newScan",
      ].forEach(
        (eventName) => {
          socket.on(
            eventName,
            refreshFromSocket
          );
        }
      );
    } catch (error) {
      console.error(
        "SOCKET ERROR:",
        error
      );

      setLiveStatus(
        "OFFLINE"
      );
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [loggedIn]);

  /* =====================================================
     ROLE PROTECTION
  ===================================================== */

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    if (
      page === "admin" &&
      !isAdmin
    ) {
      setPage(
        isModerator
          ? "moderator"
          : "dashboard"
      );

      return;
    }

    if (
      page ===
        "moderator" &&
      !isModerator &&
      !isAdmin
    ) {
      setPage(
        "dashboard"
      );
    }
  }, [
    loggedIn,
    page,
    isAdmin,
    isModerator,
  ]);

  /* =====================================================
     USER STATISTICS
  ===================================================== */

  useEffect(() => {
    if (
      !loggedIn ||
      !getToken() ||
      isAdmin ||
      isModerator
    ) {
      return;
    }

    const loadStats =
      async () => {
        try {
          const response =
            await fetch(
              `${API_URL}/api/scans`,
              {
                headers: {
                  Authorization: `Bearer ${getToken()}`,
                },
              }
            );

          const data =
            await readResponse(
              response
            );

          if (
            !response.ok ||
            !Array.isArray(
              data
            )
          ) {
            return;
          }

          setStats({
            safe:
              data.filter(
                (scan) =>
                  getVerdict(
                    scan
                  ) ===
                  "SAFE"
              ).length,

            threats:
              data.filter(
                (scan) =>
                  getVerdict(
                    scan
                  ) ===
                  "THREAT"
              ).length,
          });
        } catch (error) {
          console.error(
            "STATISTICS ERROR:",
            error
          );
        }
      };

    loadStats();
  }, [
    loggedIn,
    user,
    realtimeTick,
    isAdmin,
    isModerator,
  ]);

  /* =====================================================
     THEME
  ===================================================== */

  const toggleTheme =
    () => {
      setTheme(
        (current) =>
          current ===
          "dark"
            ? "light"
            : "dark"
      );
    };

  /* =====================================================
     OPEN LOGIN
  ===================================================== */

  const openLogin =
    () => {
      setPage("auth");

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout =
    () => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      setLoggedIn(false);

      setUser(null);

      setStats({
        safe: 0,
        threats: 0,
      });

      setPage("about");

      setLiveStatus(
        "OFFLINE"
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /* =====================================================
     AFTER LOGIN
  ===================================================== */

  const afterLogin =
    (nextUser) => {
      if (nextUser) {
        localStorage.setItem(
          "user",
          JSON.stringify(
            nextUser
          )
        );
      }

      setUser(
        nextUser
      );

      setLoggedIn(
        true
      );

      const nextRole =
        normalizeRole(
          nextUser?.role
        );

      /*
        CORRECT ROLE REDIRECT

        Admin     -> Admin Dashboard
        Moderator -> Moderator Dashboard
        User      -> User Scanner Dashboard
      */
      if (
        nextRole ===
        "admin"
      ) {
        setPage("admin");
      } else if (
        nextRole ===
        "moderator"
      ) {
        setPage(
          "moderator"
        );
      } else {
        setPage(
          "dashboard"
        );
      }

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /* =====================================================
     AUTH PAGE
  ===================================================== */

  if (
    !loggedIn &&
    page === "auth"
  ) {
    return (
      <div
        className={`app auth-app ${theme}-mode`}
      >
        <MatrixBackground theme="auth" />

        <div className="app-content">
          <AuthPage
            setLoggedIn={
              setLoggedIn
            }
            setPage={setPage}
            setUser={
              afterLogin
            }
          />
        </div>
      </div>
    );
  }

  /* =====================================================
     PUBLIC ABOUT LANDING PAGE
  ===================================================== */

  if (!loggedIn) {
    return (
      <div
        className={`app public-app ${theme}-mode`}
      >
        <MatrixBackground theme="about" />

        <div className="app-content">
          <PublicNavbar
            onLogin={
              openLogin
            }
            theme={theme}
            toggleTheme={
              toggleTheme
            }
          />

          <AboutPage
            onLogin={
              openLogin
            }
            loggedIn={
              false
            }
          />

          <footer className="footer">
            <span>
              THREATWATCH AI //
              ADVANCED
              AI-POWERED
              CYBERSECURITY
            </span>

            <span>
              SYSTEM SECURE //
              THREAT MONITORING
              ACTIVE
            </span>
          </footer>
        </div>
      </div>
    );
  }

  /* =====================================================
     BACKGROUND THEME
  ===================================================== */

  const currentTheme =
    page === "admin"
      ? "admin"
      : page ===
        "moderator"
      ? "moderator"
      : page ===
        "history"
      ? "history"
      : page ===
        "about"
      ? "about"
      : "dashboard";

  /* =====================================================
     LOGGED-IN APP
  ===================================================== */

  return (
    <div
      className={`app ${theme}-mode`}
    >
      <MatrixBackground
        theme={
          currentTheme
        }
      />

      <div className="app-content">
        <Navbar
          page={page}
          setPage={setPage}
          logout={logout}
          user={user}
          theme={theme}
          toggleTheme={
            toggleTheme
          }
        />

        <div className="realtime-bar">
          <span
            className={`realtime-dot ${liveStatus.toLowerCase()}`}
          />

          REAL-TIME SCAN
          STATUS:

          <strong>
            {liveStatus}
          </strong>
        </div>

        {/* USER / SCANNER */}

        {page ===
          "dashboard" && (
          <Dashboard
            stats={stats}
            setStats={
              setStats
            }
          />
        )}

        {/* HISTORY */}

        {page ===
          "history" && (
          <History
            setPage={
              setPage
            }
            realtimeTick={
              realtimeTick
            }
          />
        )}

        {/* ABOUT */}

        {page ===
          "about" && (
          <AboutPage
            onLogin={() =>
              setPage(
                isAdmin
                  ? "admin"
                  : isModerator
                  ? "moderator"
                  : "dashboard"
              )
            }
            loggedIn={
              true
            }
          />
        )}

        {/* MODERATOR */}

        {page ===
          "moderator" &&
          (isModerator ||
            isAdmin) && (
            <ModeratorPage
              realtimeTick={
                realtimeTick
              }
            />
          )}

        {/* ADMIN */}

        {page ===
          "admin" &&
          isAdmin && (
            <AdminPage />
          )}

        <footer className="footer">
          <span>
            THREATWATCH AI //
            ADVANCED
            AI-POWERED
            CYBERSECURITY
          </span>

          <span>
            SYSTEM SECURE //
            THREAT MONITORING
            ACTIVE
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;