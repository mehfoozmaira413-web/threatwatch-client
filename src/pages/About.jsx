import React from "react";

const About = ({ setPage }) => {
  return (
    <div className="about-page">

      {/* ================= HERO ================= */}
      <section className="about-hero">
        <div className="about-shield">🛡️</div>
        
        <span className="about-kicker">THREATWATCH // CYBERSECURITY PLATFORM</span>

        <h1>
          THREATWATCH <span>AI</span>
        </h1>

        <p>
          AI-powered cybersecurity platform designed to analyze suspicious URLs, text, claims, and images for 
          potentially dangerous or misleading content
        </p>

        {/* 🔥 TOP CYAN BUTTON */}
        <button className="tw-hero-cta" onClick={() => setPage("login")}>
          LOGIN TO THREATWATCH AI
        </button>

        <p className="tw-hero-note">Login or create an account to access the security dashboard.</p>
      </section>

      {/* ================= HOW TO USE ================= */}
      <section>
        <h2 className="feature-title">HOW TO USE THREATWATCH AI</h2>
        <p style={{textAlign: "center", color: "#8097a3", marginBottom: "40px"}}>Protect yourself in four simple steps</p>

        <div className="about-steps">
          <div>
            <span>01</span>
            <div>
              <h3>LOGIN OR REGISTER</h3>
              <p>Login to your existing account or create a secure account to access the platform.</p>
            </div>
          </div>

          <div>
            <span>02</span>
            <div>
              <h3>CHOOSE SCANNER</h3>
              <p>Select URL, Text, or Image security analysis based on suspicious content.</p>
            </div>
          </div>

          <div>
            <span>03</span>
            <div>
              <h3>GET AI RESULTS</h3>
              <p>Receive risk score, verdict, confidence level, and detailed AI analysis.</p>
            </div>
          </div>

          <div>
            <span>04</span>
            <div>
              <h3>REVIEW HISTORY</h3>
              <p>Review all your previous security scans and analysis from the History section.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section>
        <h2 className="feature-title">OUR 3 CORE FEATURES</h2>
        <p style={{textAlign: "center", color: "#8097a3", marginBottom: "40px"}}>Three powerful ways to analyze suspicious content</p>

        <div className="feature-grid">
          {/* URL */}
          <div className="feature-card">
            <div className="feature-icon">➤</div>
            <h3>URL THREAT SCANNER</h3>
            <p>Analyze website links for phishing, scams, suspicious domains, and other dangerous characteristics that could compromise your security.</p>
            <button className="tw-action-secondary" style={{width: "100%", marginTop: "20px"}} onClick={() => setPage("dashboard")}>
              Try URL Scan →
            </button>
          </div>

          {/* TEXT */}
          <div className="feature-card">
            <div className="feature-icon">Aa</div>
            <h3>TEXT / CLAIM ANALYZER</h3>
            <p>Analyze messages, claims, statements, and written information for fraud indicators, deceptive language, and possible threats.</p>
            <button className="tw-action-secondary" style={{width: "100%", marginTop: "20px"}} onClick={() => setPage("dashboard")}>
              Try Text Scan →
            </button>
          </div>

          {/* IMAGE */}
          <div className="feature-card">
            <div className="feature-icon">🖼️</div>
            <h3>IMAGE THREAT SCANNER</h3>
            <p>Upload screenshots or images containing suspicious messages, advertisements, claims, links, or other digital content for AI analysis.</p>
            <button className="tw-action-secondary" style={{width: "100%", marginTop: "20px"}} onClick={() => setPage("dashboard")}>
              Try Image Scan →
            </button>
          </div>
        </div>
      </section>

      {/* ================= SECURITY BOX ================= */}
      <div style={{
        maxWidth: "1200px", margin: "0 auto 60px", padding: "25px", display: "flex", gap: "20px",
        alignItems: "center", border: "1px solid rgba(255, 180, 0, 0.2)", background: "rgba(255, 180, 0, 0.05)"
      }}>
        <div style={{fontSize: "30px"}}>⚠️</div>
        <div>
          <h3 style={{color: "#ffc66d", marginBottom: "5px"}}>STAY SAFE. STAY AWARE.</h3>
          <p style={{color: "#a0c8ff"}}>Always analyze suspicious links, messages, claims, and images before trusting or sharing them with others.</p>
        </div>
      </div>

      {/* ================= CTA - BOTTOM BUTTONS ================= */}
      <section className="about-cta">
        <h2>READY TO PROTECT YOUR DIGITAL SPACE?</h2>
        <p>Login now and start analyzing suspicious digital content with AI-powered security.</p>
        
        {/* 🔥 BOTTOM 2 BUTTONS */}
        <div className="tw-action-buttons">
          <button className="tw-action-primary" onClick={() => setPage("login")}>
            LOGIN
          </button>
          <button className="tw-action-secondary" onClick={() => setPage("register")}>
            REGISTER
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={{textAlign: "center", padding: "40px 0", color: "#647c92", fontSize: "12px"}}>
        <p><strong style={{color: "#00d9ff"}}>THREATWATCH AI</strong> // ADVANCED CYBERSECURITY PLATFORM</p>
        <span>© 2026 All Rights Reserved</span>
      </footer>

    </div>
  );
};

export default About;