import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./dashboard.css";

const Dashboard = () => {
  const { actor } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalCredentials: 0,
    verifiedCredentials: 0,
    pendingCredentials: 0,
    nftsGenerated: 0
  });
  const [recentCredentials, setRecentCredentials] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "success",
      title: "Credential Verified",
      message: "Your Web Development certificate has been verified.",
      time: "2 hours ago"
    },
    {
      id: 2,
      type: "info",
      title: "NFT Generated",
      message: "Your Bachelor's Degree NFT has been successfully generated.",
      time: "1 day ago"
    },
    {
      id: 3,
      type: "warning",
      title: "Review in Progress",
      message: "Your Project Management credential is being reviewed.",
      time: "2 days ago"
    }
  ]);
  const [userPrincipal, setUserPrincipal] = useState("");

  useEffect(() => {
    if (actor) {
      loadDashboardData();
    }
  }, [actor]);

  const loadDashboardData = async () => {
    try {
      // Load user principal for debugging
      const principal = await actor.getCurrentUserPrincipal();
      setUserPrincipal(principal);
      console.log("Current user principal:", principal);

      // Load files (credentials)
      const files = await actor.getFiles();
      const totalCredentials = files.length;
      const verifiedCredentials = files.filter(f => f.ecdsa_sign && f.schnorr_sign).length;
      const pendingCredentials = totalCredentials - verifiedCredentials;

      // Load NFTs
      const nfts = await actor.getUserNFTs();
      const nftsGenerated = nfts.length;

      setStats({
        totalCredentials,
        verifiedCredentials,
        pendingCredentials,
        nftsGenerated
      });

      // Transform files to recent credentials format
      const recent = files.slice(0, 3).map(file => ({
        id: file.name,
        title: file.name,
        institution: "Institution", // You might want to add this to your file structure
        status: file.ecdsa_sign ? "Verified" : "Pending",
        date: new Date().toLocaleDateString(), // You might want to add creation date
        icon: getCredentialIcon(file.fileType)
      }));

      setRecentCredentials(recent);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const getCredentialIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    return '📋';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return 'status-verified';
      case 'Pending': return 'status-pending';
      default: return 'status-default';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      default: return '🔔';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back! Here's an overview of your credentials and NFTs.
          </p>
          {userPrincipal && (
            <div className="debug-info">
              <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                Principal ID: {userPrincipal.slice(0, 12)}...{userPrincipal.slice(-8)}
                {(userPrincipal === "k2ir2-52b5o-sc6f7-ai4bg-vdrf3-wghtz-xz4us-77lr6-y6cfv-5qlvy-sqe" || userPrincipal === "ues2k-6iwxj-nbezb-owlhg-nsem4-abqjc-74ocv-lsxps-ytjv4-2tphv-yqe") && (
                  <span style={{ color: 'var(--success-color)', fontWeight: '600' }}> (Super Admin)</span>
                )}
              </small>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalCredentials}</div>
              <div className="stat-label">Total Credentials</div>
              <div className="stat-change positive">↑ 4%</div>
              <div className="stat-period">From last month</div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.verifiedCredentials}</div>
              <div className="stat-label">Verified Credentials</div>
              <div className="stat-change positive">↑ 12%</div>
              <div className="stat-period">From last month</div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pendingCredentials}</div>
              <div className="stat-label">Pending Credentials</div>
              <div className="stat-change negative">↓ 2%</div>
              <div className="stat-period">From last month</div>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 8h20" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8" cy="14" r="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 14h2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.nftsGenerated}</div>
              <div className="stat-label">NFTs Generated</div>
              <div className="stat-change positive">↑ 25%</div>
              <div className="stat-period">From last month</div>
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          {/* Recent Credentials */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Recent Credentials</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="credentials-table">
              <div className="table-header">
                <div className="table-col">Credential</div>
                <div className="table-col">Status</div>
                <div className="table-col">Date</div>
                <div className="table-col">Actions</div>
              </div>
              {recentCredentials.length > 0 ? (
                recentCredentials.map((credential, index) => (
                  <div key={index} className="table-row">
                    <div className="table-col">
                      <div className="credential-info">
                        <div className="credential-icon">{credential.icon}</div>
                        <div className="credential-details">
                          <div className="credential-name">{credential.title}</div>
                          <div className="credential-institution">{credential.institution}</div>
                        </div>
                      </div>
                    </div>
                    <div className="table-col">
                      <span className={`status-badge ${getStatusColor(credential.status)}`}>
                        {credential.status}
                      </span>
                    </div>
                    <div className="table-col">
                      <span className="date-text">{credential.date}</span>
                    </div>
                    <div className="table-col">
                      <div className="action-buttons">
                        <button className="action-btn view-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button className="action-btn share-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                            <path d="m8.59 13.51 6.83 3.98" stroke="currentColor" strokeWidth="2"/>
                            <path d="m15.41 6.51-6.82 3.98" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No credentials found. Upload your first credential to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Notifications</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;