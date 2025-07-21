import React from "react";
import ThemeToggle from "./ThemeToggle";
import "./header.css";

const Header = ({ onLogout, userInfo, onMenuToggle }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="header-right">
        <ThemeToggle />
        
        <button className="notification-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="notification-badge">3</span>
        </button>

        <button className="logout-btn-header" onClick={onLogout} title="Sign Out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
            <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        <div className="user-menu">
          <button className="user-menu-trigger">
            <div className="user-avatar">
              <img src="/api/placeholder/32/32" alt="User Avatar" />
            </div>
            <div className="user-info">
              <span className="user-name">{userInfo?.name || "Alex Johnson"}</span>
              <span className="user-email">{userInfo?.email || "alex@example.com"}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="chevron">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="user-menu-dropdown">
            <div className="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Profile
            </div>
            <div className="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="m12 1 1.68.28a11 11 0 0 1 7.07 7.07L22 10l-1.25 1.68a11 11 0 0 1-7.07 7.07L12 23l-1.68-1.25a11 11 0 0 1-7.07-7.07L2 12l1.25-1.68A11 11 0 0 1 10.32 3.28L12 1z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Settings
            </div>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item logout-btn" onClick={onLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;