import { useEffect, useState } from "react";
import Credentials from "../credentials/Credentials";
import VerificationRequests from "../verification/VerificationRequests";
import RequestVerification from "../verification/RequestVerification";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { NavigationProvider, useNavigation } from "../context/NavigationContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardHome from "../components/Dashboard";
import AdminPanel from "../admin/AdminPanel";
import UploadCredentials from "../components/UploadCredentials";
import MyNFTs from "../components/MyNFTs";
import "../styles/globals.css";
import "./dashboard.css";

const DashboardContent = () => {
  const { isAuthenticated, logout } = useAuth();
  const { currentView } = useNavigation();
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
    console.log("🔄 Dashboard renderMainContent called with currentView:", currentView);
    switch (currentView) {
      case "dashboard":
        return <DashboardHome />;
      case "credentials":
        return <UploadCredentials />;
      case "nfts":
        return <MyNFTs />;
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

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={handleSidebarClose} />}
      <Sidebar 
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
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
  );
};

const Dashboard = () => {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <DashboardContent />
      </NavigationProvider>
    </ThemeProvider>
  );
};

export default Dashboard;
