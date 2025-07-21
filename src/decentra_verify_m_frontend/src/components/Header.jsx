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
            <div className="user-info">
              <span className="user-name">{userInfo?.name}</span>
              <span className="user-email">{userInfo?.email}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="chevron">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;