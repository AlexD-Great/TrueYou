import { useEffect, useState } from "react";
import Credentials from "../credentials/Credentials";
import VerificationRequests from "../verification/VerificationRequests";
import RequestVerification from "../verification/RequestVerification";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./dashboard.css";

const Dashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("credentials");
  let navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "credentials":
        return <Credentials />;
      case "verification-requests":
        return <VerificationRequests />;
      case "request-verification":
        return <RequestVerification />;
      default:
        return <Credentials />;
    }
  };

  return (
    <div>
      {/* Header */}
      <header>
        <div className="head-top">
          <div className="container-fluid">
            <div className="row d_flex">
              <div className="col-sm-3">
                <div className="logo">
                  <a href="/">DecentraVerify</a>
                </div>
              </div>
              <div className="col-sm-6">
                <nav className="dashboard-nav">
                  <button
                    className={`nav-tab ${activeTab === "credentials" ? "active" : ""}`}
                    onClick={() => setActiveTab("credentials")}
                  >
                    My Credentials
                  </button>
                  <button
                    className={`nav-tab ${activeTab === "verification-requests" ? "active" : ""}`}
                    onClick={() => setActiveTab("verification-requests")}
                  >
                    Verification Requests
                  </button>
                  <button
                    className={`nav-tab ${activeTab === "request-verification" ? "active" : ""}`}
                    onClick={() => setActiveTab("request-verification")}
                  >
                    Request Verification
                  </button>
                </nav>
              </div>
              <div className="col-sm-3">
                <button onClick={logout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <h2>Dashboard</h2>
        </div>
        {isAuthenticated ? (
          <p>Welcome to the dashboard!</p>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      <div className="dashboard-items">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;
