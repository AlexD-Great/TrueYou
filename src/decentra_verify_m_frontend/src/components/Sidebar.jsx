import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import "./sidebar.css";

const Sidebar = ({ currentView, setCurrentView, onLogout }) => {
  const { theme } = useTheme();
  const { actor } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState("");
  console.log('currentView', currentView)

  useEffect(() => {
    if (actor) {
      checkAdminStatus();
    }
  }, [actor]);

  const checkAdminStatus = async () => {
    try {
      // Get current user principal for debugging
      const principal = await actor.getCurrentUserPrincipal();
      console.log("🔍 Sidebar - Current user principal:", principal);
      setUserPrincipal(principal);
      
      // Check user roles
      const adminStatus = await actor.isCurrentUserAdmin();
      const verifierStatus = await actor.isCurrentUserVerifier();
      const reviewerStatus = await actor.isCurrentUserReviewer();
      
      const hasVerifierRights = adminStatus || verifierStatus || reviewerStatus;
      
      console.log("🔍 Sidebar - Admin status:", adminStatus);
      console.log("🔍 Sidebar - Verifier status:", verifierStatus);
      console.log("🔍 Sidebar - Reviewer status:", reviewerStatus);
      console.log("🔍 Sidebar - Has verifier rights:", hasVerifierRights);
      
      setIsAdmin(adminStatus);
      setIsVerifier(hasVerifierRights);
      
      // Log menu items that will be shown
      const menuItemsToShow = [
        "dashboard", "credentials", "request-verification",
        ...(hasVerifierRights ? ["verification-requests"] : []),
        ...(adminStatus ? ["admin"] : [])
      ];
      console.log("🔍 Sidebar - Menu items to render:", menuItemsToShow);
      
    } catch (error) {
      console.error("❌ Sidebar - Error checking user status:", error);
      setIsAdmin(false);
      setIsVerifier(false);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: "credentials",
      label: "Upload & Manage",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: "nfts",
      label: "My NFTs",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 7h10v6H7z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      )
    },
    // Conditionally include Verification Requests only for verifiers/reviewers/admins
    ...(isVerifier ? [{
      id: "verification-requests",
      label: "Verification Requests",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
          <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }] : []),
    {
      id: "request-verification",
      label: "Request Verification",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    // Conditionally include Admin Panel only for admins
    ...(isAdmin ? [{
      id: "admin",
      label: "Admin Panel",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="m12 1 1.68.28a11 11 0 0 1 7.07 7.07L22 10l-1.25 1.68a11 11 0 0 1-7.07 7.07L12 23l-1.68-1.25a11 11 0 0 1-7.07-7.07L2 12l1.25-1.68A11 11 0 0 1 10.32 3.28L12 1z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }] : [])
  ];

  const accountItems = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: "wallet",
      label: "Wallet Connection",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="3" width="15" height="13" stroke="currentColor" strokeWidth="2"/>
          <path d="m16 8 4-4-4-4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="m12 1 1.68.28a11 11 0 0 1 7.07 7.07L22 10l-1.25 1.68a11 11 0 0 1-7.07 7.07L12 23l-1.68-1.25a11 11 0 0 1-7.07-7.07L2 12l1.25-1.68A11 11 0 0 1 10.32 3.28L12 1z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  const supportItems = [
    {
      id: "help",
      label: "Help & Support",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  const handleItemClick = (itemId) => {
    console.log("handleItemClick", itemId);
    console.log("🔧 setCurrentView function:", setCurrentView.name || "anonymous");
    setCurrentView(itemId);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">📋</div>
          <span className="logo-text">TrueYou</span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="user-info">
          <div className="user-avatar">
            <div className="avatar-fallback">
              {userPrincipal ? userPrincipal.slice(0, 2).toUpperCase() : "U"}
            </div>
            <div className="user-status online"></div>
          </div>
          <div className="user-details">
            <div className="user-name">{userPrincipal ? userPrincipal.slice(0, 8) + '...' : "Loading..."}</div>
            <div className="user-email">{userPrincipal || "Loading principal..."}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${currentView === item.id ? "active" : ""}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Account</div>
            <ul className="nav-list">
              {accountItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${currentView === item.id ? "active" : ""}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Support</div>
            <ul className="nav-list">
              {supportItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${currentView === item.id ? "active" : ""}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={onLogout}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;