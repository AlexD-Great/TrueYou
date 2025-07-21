import { useEffect, useState } from "react";
import Credentials from "../credentials/Credentials";
import VerificationRequests from "../verification/VerificationRequests";
import RequestVerification from "../verification/RequestVerification";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardHome from "../components/Dashboard";
import AdminPanel from "../admin/AdminPanel";
import UploadCredentials from "../components/UploadCredentials";
import "../styles/globals.css";
import "./dashboard.css";

const Dashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  let navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardHome />;
      case "credentials":
        return <UploadCredentials />;
      case "verification-requests":
        return <VerificationRequests />;
      case "request-verification":
        return <RequestVerification />;
      case "admin":
        return <AdminPanel />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <ThemeProvider>
      <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          onLogout={logout}
        />
        <Header 
          onLogout={logout}
          onMenuToggle={handleMenuToggle}
          userInfo={{ name: "Alex Johnson", email: "alex@example.com" }}
        />
        <main className="main-content">
          {renderMainContent()}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Dashboard;
