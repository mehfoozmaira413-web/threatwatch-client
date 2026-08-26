import { useEffect, useState } from "react";
import axios from "axios";
import "./Hero.css";

export default function Hero() {
  // ==========================================
  // URL SCANNER
  // ==========================================

  const [url, setUrl] = useState("");
  const [urlScanning, setUrlScanning] = useState(false);
  const [urlReport, setUrlReport] = useState(null);

  // ==========================================
  // TEXT SCANNER
  // ==========================================

  const [text, setText] = useState("");
  const [textScanning, setTextScanning] = useState(false);
  const [textReport, setTextReport] = useState(null);

  // ==========================================
  // IMAGE SCANNER
  // ==========================================

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageScanning, setImageScanning] = useState(false);
  const [imageReport, setImageReport] = useState(null);

  // ==========================================
  // TOKEN
  // ==========================================

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  // ==========================================
  // LIVE STATS
  // ==========================================

  const [stats, setStats] = useState({
    scanned: 12487,
    blocked: 3421,
    accuracy: 99.99,
  });

  // ==========================================
  // CHECK TOKEN
  // ==========================================

  useEffect(() => {
    const checkToken = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", checkToken);

    return () => {
      window.removeEventListener("storage", checkToken);
    };
  }, []);

  // ==========================================
  // LIVE STATS
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        scanned:
          prev.scanned + Math.floor(Math.random() * 3),

        blocked:
          prev.blocked + Math.floor(Math.random() * 2),

        accuracy: 99.99,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // MATRIX BACKGROUND
  // ==========================================

  useEffect(() => {
    const canvas = document.getElementById("matrix");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let animationFrame;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const words = [
      "01",
      "10",
      "101",
      "010",
      "ALERT",
      "SCAN",
      "THREAT",
      "SAFE",
      "BREACH",
      "OK",
      "SECURE",
      "VERIFY",
      "AI",
      "CYBER",
      "DATA",
      "SYSTEM",
    ];

    const fontSize = 18;

    let columns = Math.floor(
      window.innerWidth / fontSize
    );

    let drops = [];

    const createDrops = () => {
      columns = Math.floor(
        window.innerWidth / fontSize
      );

      drops = [];

      for (let i = 0; i < columns; i++) {
        drops.push({
          y:
            Math.random() *
            -window.innerHeight,

          word:
            words[
              Math.floor(
                Math.random() * words.length
              )
            ],

          speed:
            Math.random() * 5 + 5,
        });
      }
    };

    createDrops();

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "Courier New", monospace`;
      ctx.shadowBlur = 0;

      drops.forEach((drop, index) => {
        if (Math.random() > 0.97) {
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = "#00ff41";
        }

        ctx.fillText(
          drop.word,
          index * fontSize,
          drop.y
        );

        drop.y += drop.speed;

        if (drop.y > height + 100) {
          drop.y = Math.random() * -300;

          drop.word =
            words[
              Math.floor(
                Math.random() * words.length
              )
            ];
        }
      });

      animationFrame =
        requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      createDrops();
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // ==========================================
  // URL SCAN
  // ==========================================

  const handleUrlScan = async () => {
    if (!url.trim()) {
      alert("Please enter a URL first.");
      return;
    }

    if (!token) {
      alert("Please login first.");
      return;
    }

    setUrlScanning(true);
    setUrlReport(null);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/scan",
        {
          url: url.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUrlReport(response.data);
    } catch (error) {
      console.error("URL SCAN ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.details ||
          "URL scan failed."
      );
    } finally {
      setUrlScanning(false);
    }
  };

  // ==========================================
  // TEXT SCAN
  // ==========================================

  const handleTextScan = async () => {
    if (!text.trim()) {
      alert("Please enter text or a claim first.");
      return;
    }

    if (!token) {
      alert("Please login first.");
      return;
    }

    setTextScanning(true);
    setTextReport(null);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/scan/text",
        {
          text: text.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTextReport(response.data);
    } catch (error) {
      console.error("TEXT SCAN ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.details ||
          "Text scan failed."
      );
    } finally {
      setTextScanning(false);
    }
  };

  // ==========================================
  // IMAGE SELECT
  // ==========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    setImage(file);
    setImageReport(null);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ==========================================
  // IMAGE SCAN
  // ==========================================

  const handleImageScan = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    if (!token) {
      alert("Please login first.");
      return;
    }

    setImageScanning(true);
    setImageReport(null);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5001/api/scan/image",
          {
            image: reader.result,
            mimeType: image.type,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setImageReport(response.data);
      } catch (error) {
        console.error(
          "IMAGE SCAN ERROR:",
          error
        );

        alert(
          error.response?.data?.message ||
            error.response?.data?.details ||
            "Image scan failed."
        );
      } finally {
        setImageScanning(false);
      }
    };

    reader.onerror = () => {
      setImageScanning(false);
      alert("Image processing failed.");
    };

    reader.readAsDataURL(image);
  };

  // ==========================================
  // RISK COLOR
  // ==========================================

  const getRiskColor = (report) => {
    if (!report) return "#00ff41";

    if (report.riskScore >= 70) {
      return "#ff1744";
    }

    if (report.riskScore >= 40) {
      return "#ffbd2e";
    }

    return "#00ff41";
  };

  // ==========================================
  // RESULT BOX
  // ==========================================

  const ResultBox = ({ report }) => {
    if (!report) return null;

    return (
      <div
        className="result-box-black"
        style={{
          borderColor: getRiskColor(report),
        }}
      >
        <p className="result-heading">
          THREAT ASSESSMENT COMPLETE
        </p>

        <h2
          style={{
            color: getRiskColor(report),
          }}
        >
          {report.riskScore ?? 0}/100
        </h2>

        <p
          className={
            report.isSafe
              ? "safe"
              : "danger"
          }
        >
          {report.isSafe
            ? "✓ SAFE"
            : "⚠ THREAT DETECTED"}
        </p>

        <div className="result-summary">
          <strong>SUMMARY</strong>

          <p>
            {report.summary ||
              "No summary available."}
          </p>
        </div>

        <div className="result-threats">
          <strong>DETECTED THREATS</strong>

          {report.threats &&
          report.threats.length > 0 ? (
            <ul>
              {report.threats.map(
                (threat, index) => (
                  <li key={index}>
                    {threat}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="safe">
              No threats detected.
            </p>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="hero-wrapper">

      <canvas id="matrix"></canvas>

      <div className="hero-container">

        {/* HERO */}

        <section className="hero-center">

          <p className="hero-kicker">
            THREATWATCH AI // INTELLIGENCE SYSTEM
          </p>

          <h1 className="hero-title">
            VERIFY TRUTH.
            <br />
            <span>DEFEAT MISINFORMATION.</span>
          </h1>

          <p className="hero-sub">
            Multi-Agent AI scans{" "}
            <span>
              URLs, TEXT & IMAGES
            </span>{" "}
            in real time.
          </p>

        </section>

        {/* STATS */}

        <section className="stats-bar">

          <div className="stat-box-black stat-safe">

            <div className="stat-icon">
              ✓
            </div>

            <div>
              <h3>
                {stats.scanned.toLocaleString()}
              </h3>

              <p>
                CLAIMS SCANNED
              </p>
            </div>

          </div>

          <div className="stat-box-black stat-danger">

            <div className="stat-icon">
              !
            </div>

            <div>
              <h3>
                {stats.blocked.toLocaleString()}
              </h3>

              <p>
                THREATS BLOCKED
              </p>
            </div>

          </div>

          <div className="stat-box-black stat-accuracy">

            <div className="stat-icon">
              %
            </div>

            <div>
              <h3>
                {stats.accuracy}%
              </h3>

              <p>
                ACCURACY RATE
              </p>
            </div>

          </div>

        </section>

        {/* SCANNERS */}

        <section className="scanner-grid">

          {/* URL */}

          <div className="scanner-section">

            <div className="verify-card-black">

              <div className="card-header-black">

                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <p>
                  root@threatwatch:~#
                  url_verification --v4.0
                </p>

              </div>

              <div className="card-body-black">

                <div className="scanner-title">
                  🔗 URL THREAT SCANNER
                </div>

                <p className="scanner-description">
                  Analyze suspicious website URLs
                  and detect potential phishing,
                  malicious or deceptive threats.
                </p>

                <label className="input-label">
                  {">"} ENTER TARGET URL
                </label>

                <div className="input-row-black">

                  <input
                    value={url}
                    onChange={(e) =>
                      setUrl(e.target.value)
                    }
                    placeholder="https://example.com"
                    disabled={urlScanning}
                  />

                  <button
                    onClick={handleUrlScan}
                    disabled={urlScanning}
                  >
                    {urlScanning
                      ? "SCANNING..."
                      : "SCAN URL"}
                  </button>

                </div>

                <div className="scan-line"></div>

                <p className="status-text">
                  [
                  {urlScanning
                    ? " STATUS: SCANNING "
                    : urlReport
                    ? " STATUS: COMPLETE "
                    : " STATUS: STANDBY "}
                  ]
                </p>

                <ResultBox
                  report={urlReport}
                />

              </div>

            </div>

          </div>

          {/* TEXT */}

          <div className="scanner-section">

            <div className="verify-card-black">

              <div className="card-header-black">

                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <p>
                  root@threatwatch:~#
                  text_verification --v4.0
                </p>

              </div>

              <div className="card-body-black">

                <div className="scanner-title">
                  📝 TEXT / CLAIM VERIFIER
                </div>

                <p className="scanner-description">
                  Analyze news, claims, statements
                  and online information for possible
                  misinformation or suspicious content.
                </p>

                <label className="input-label">
                  {">"} ENTER TEXT / CLAIM
                </label>

                <textarea
                  className="text-scan-input"
                  value={text}
                  onChange={(e) =>
                    setText(e.target.value)
                  }
                  placeholder="Paste a suspicious claim, news statement or information here..."
                  disabled={textScanning}
                />

                <button
                  className="full-scan-button"
                  onClick={handleTextScan}
                  disabled={textScanning}
                >
                  {textScanning
                    ? "ANALYZING TEXT..."
                    : "VERIFY TEXT"}
                </button>

                <div className="scan-line"></div>

                <p className="status-text">
                  [
                  {textScanning
                    ? " STATUS: ANALYZING "
                    : textReport
                    ? " STATUS: COMPLETE "
                    : " STATUS: STANDBY "}
                  ]
                </p>

                <ResultBox
                  report={textReport}
                />

              </div>

            </div>

          </div>

          {/* IMAGE */}

          <div className="scanner-section">

            <div className="verify-card-black">

              <div className="card-header-black">

                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <p>
                  root@threatwatch:~#
                  image_verification --v4.0
                </p>

              </div>

              <div className="card-body-black">

                <div className="scanner-title">
                  🖼️ IMAGE THREAT ANALYZER
                </div>

                <p className="scanner-description">
                  Upload an image and analyze
                  suspicious visual information,
                  claims and potentially misleading
                  content.
                </p>

                <label className="input-label">
                  {">"} SELECT IMAGE
                </label>

                <label className="image-upload-box">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Selected preview"
                      className="image-preview"
                    />
                  ) : (
                    <>
                      <span className="upload-icon">
                        🖼️
                      </span>

                      <span>
                        CLICK TO SELECT IMAGE
                      </span>

                      <small>
                        PNG / JPG / JPEG • MAX 10MB
                      </small>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageChange}
                    hidden
                    disabled={imageScanning}
                  />

                </label>

                <button
                  className="full-scan-button"
                  onClick={handleImageScan}
                  disabled={
                    imageScanning || !image
                  }
                >
                  {imageScanning
                    ? "ANALYZING IMAGE..."
                    : "SCAN IMAGE"}
                </button>

                <div className="scan-line"></div>

                <p className="status-text">
                  [
                  {imageScanning
                    ? " STATUS: ANALYZING "
                    : imageReport
                    ? " STATUS: COMPLETE "
                    : " STATUS: STANDBY "}
                  ]
                </p>

                <ResultBox
                  report={imageReport}
                />

              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}