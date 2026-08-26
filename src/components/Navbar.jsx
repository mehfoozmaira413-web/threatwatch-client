import "./Navbar.css";

export default function Navbar({ setPage, logout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <nav className="navbar">
      {/* LOGO */}
      <div
        className="navbar-logo"
        onClick={() => setPage("home")}
      >
        <span className="logo-shield">🛡️</span>
        <span className="logo-text">
          ThreatWatch <span>AI</span>
        </span>
      </div>

      {/* NAVIGATION */}
      <div className="navbar-links">
        <button
          className="nav-link active"
          onClick={() => setPage("home")}
        >
          🏠 Dashboard
        </button>

        <button
          className="nav-link"
          onClick={() => setPage("history")}
        >
          📜 History
        </button>
      </div>

      {/* USER + LOGOUT */}
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="user-icon">
            👤
          </div>

          <div className="user-info">
            <strong>
              {user.name || "User"}
            </strong>

            <span>
              SECURE SESSION
            </span>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          ⏻ Logout
        </button>
      </div>
    </nav>
  );
}