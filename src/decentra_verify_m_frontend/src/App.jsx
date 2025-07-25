import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "declarations/decentra_verify_m_backend";
import { canisterId } from "declarations/decentra_verify_m_backend/index.js";
import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./auth/AuthContext";
import { NavigationProvider, useNavigation } from "./context/NavigationContext";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AdminPanel from "./admin/AdminPanel";
import MyNFTs from "./components/MyNFTs";
import RequestVerification from "./verification/RequestVerification";
import VerificationRequests from "./verification/VerificationRequests";
import "./styles/globals.css";
import "./index.css";

const network = process.env.DFX_NETWORK;
const identityProvider =
  network === "ic"
    ? "https://identity.ic0.app" // Mainnet
    : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943"; // Local

const AppContent = () => {
  const { currentView } = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState();
  const [actor, setActor] = useState();
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState();
  const [fileTransferProgress, setFileTransferProgress] = useState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    updateActor();
    setErrorMessage();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated]);

  // Debug currentView changes
  useEffect(() => {
    console.log("📍 currentView state changed to:", currentView);
  }, [currentView]);

  async function updateActor() {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const actor = createActor(canisterId, {
      agentOptions: {
        identity,
      },
    });
    console.log(canisterId);
    const newIsAuthenticated = await authClient.isAuthenticated();

    setActor(actor);
    setAuthClient(authClient);
    
    // Only update isAuthenticated if it actually changed to prevent unnecessary re-renders
    setIsAuthenticated(prevAuth => {
      if (prevAuth !== newIsAuthenticated) {
        console.log("🔐 Authentication status changed:", prevAuth, "->", newIsAuthenticated);
        return newIsAuthenticated;
      }
      return prevAuth;
    });
  }

  async function login() {
    await authClient.login({
      identityProvider,
      onSuccess: updateActor,
    });
  }

  async function logout() {
    await authClient.logout();
    updateActor();
  }

  async function loadFiles() {
    try {
      console.log(actor);
      const fileList = await actor.getFiles();
      setFiles(fileList);
    } catch (error) {
      console.error("Failed to load files:", error);
      setErrorMessage("Failed to load files. Please try again.");
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    setErrorMessage();

    if (!file) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    if (await actor.checkFileExists(file.name)) {
      setErrorMessage(
        `File "${file.name}" already exists. Please choose a different file name.`
      );
      return;
    }
    setFileTransferProgress({
      mode: "Uploading",
      fileName: file.name,
      progress: 0,
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = new Uint8Array(e.target.result);
      const chunkSize = 1024 * 1024; // 1 MB chunks
      const totalChunks = Math.ceil(content.length / chunkSize);

      try {
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, content.length);
          const chunk = content.slice(start, end);

          await actor.uploadFileChunk(file.name, chunk, BigInt(i), file.type);
          setFileTransferProgress((prev) => ({
            ...prev,
            progress: Math.floor(((i + 1) / totalChunks) * 100),
          }));
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setErrorMessage(`Failed to upload ${file.name}: ${error.message}`);
      } finally {
        await loadFiles();
        setFileTransferProgress(null);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleFileDownload(name) {
    setFileTransferProgress({
      mode: "Downloading",
      fileName: name,
      progress: 0,
    });
    try {
      const totalChunks = Number(await actor.getTotalChunks(name));
      const fileType = await actor.getFileType(name)[0];
      let chunks = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkBlob = await actor.getFileChunk(name, BigInt(i));
        if (chunkBlob) {
          chunks.push(chunkBlob[0]);
        } else {
          throw new Error(`Failed to retrieve chunk ${i}`);
        }

        setFileTransferProgress((prev) => ({
          ...prev,
          progress: Math.floor(((i + 1) / totalChunks) * 100),
        }));
      }

      const data = new Blob(chunks, { type: fileType });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      setErrorMessage(`Failed to download ${name}: ${error.message}`);
    } finally {
      setFileTransferProgress(null);
    }
  }

  async function handleFileDelete(name) {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const success = await actor.deleteFile(name);
        if (success) {
          await loadFiles();
        } else {
          setErrorMessage("Failed to delete file");
        }
      } catch (error) {
        console.error("Delete failed:", error);
        setErrorMessage(`Failed to delete ${name}: ${error.message}`);
      }
    }
  }

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderMainContent = () => {
    console.log("🔄 renderMainContent called with currentView:", currentView);
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "upload":
        return renderUploadView();
      case "credentials":
        return renderCredentialsView();
      case "nfts":
        return renderNFTsView();
      case "request-verification":
        return <RequestVerification />;
      case "verification-requests":
        return <VerificationRequests />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  const renderUploadView = () => (
    <div className="upload-view">
      <div className="upload-header">
        <h1>Upload Credential</h1>
        <p>Upload your credentials for verification and NFT generation</p>
      </div>
      <div className="upload-content">
        <input
          type="file"
          onChange={handleFileUpload}
          className="file-input"
        />
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
        {fileTransferProgress && (
          <div className="progress-info">
            {`${fileTransferProgress.mode} ${fileTransferProgress.fileName} ... ${fileTransferProgress.progress}%`}
          </div>
        )}
      </div>
    </div>
  );

  const renderCredentialsView = () => (
    <div className="credentials-view">
      <div className="credentials-header">
        <h1>My Credentials</h1>
        <p>Manage your uploaded credentials</p>
      </div>
      <div className="credentials-content">
        {files.length === 0 ? (
          <div className="empty-state">
            <p>No credentials found. Upload your first credential to get started!</p>
          </div>
        ) : (
          <div className="credentials-grid">
            {files.map((file) => (
              <div key={file.name} className="credential-card">
                <div className="credential-info">
                  <h3>{file.name}</h3>
                  <p>Size: {file.size} bytes</p>
                  <p>Type: {file.fileType}</p>
                </div>
                <div className="credential-actions">
                  <button onClick={() => handleFileDownload(file.name)}>
                    Download
                  </button>
                  <button onClick={() => handleFileDelete(file.name)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNFTsView = () => <MyNFTs />;
  console.log('renderNFTsView')

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <div className="login-screen">
          <div className="login-container">
            <div className="login-card">
              <div className="logo">
                <div className="logo-icon">📋</div>
                <h1>TrueYou</h1>
              </div>
              <p>Secure credential verification on the Internet Computer</p>
              <button onClick={login} className="login-btn">
                Login with Internet Identity
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }
  console.log('renderNFTsView-2')

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <AuthProvider>
        <Sidebar 
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
      </AuthProvider>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </ThemeProvider>
  );
}

export default App;
