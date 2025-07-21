import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./uploadCredentials.css";

const UploadCredentials = () => {
  const { actor } = useAuth();
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fileTransferProgress, setFileTransferProgress] = useState(null);

  useEffect(() => {
    if (actor) {
      loadFiles();
    }
  }, [actor]);

  const loadFiles = async () => {
    try {
      const fileList = await actor.getFiles();
      setFiles(fileList);
    } catch (error) {
      console.error("Failed to load files:", error);
      setErrorMessage("Failed to load files. Please try again.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setErrorMessage("");
    setSuccessMessage("");

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
        setSuccessMessage(`Successfully uploaded "${file.name}"`);
        await loadFiles();
      } catch (error) {
        console.error("Upload failed:", error);
        setErrorMessage(`Failed to upload ${file.name}: ${error.message}`);
      } finally {
        setFileTransferProgress(null);
        // Reset file input
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileDownload = async (name) => {
    setFileTransferProgress({
      mode: "Downloading",
      fileName: name,
      progress: 0,
    });

    try {
      const totalChunks = Number(await actor.getTotalChunks(name));
      const fileType = await actor.getFileType(name);
      let chunks = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkBlob = await actor.getFileChunk(name, BigInt(i));
        if (chunkBlob && chunkBlob[0]) {
          chunks.push(chunkBlob[0]);
        } else {
          throw new Error(`Failed to retrieve chunk ${i}`);
        }

        setFileTransferProgress((prev) => ({
          ...prev,
          progress: Math.floor(((i + 1) / totalChunks) * 100),
        }));
      }

      const data = new Blob(chunks, { type: fileType?.[0] || 'application/octet-stream' });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessMessage(`Successfully downloaded "${name}"`);
    } catch (error) {
      console.error("Download failed:", error);
      setErrorMessage(`Failed to download ${name}: ${error.message}`);
    } finally {
      setFileTransferProgress(null);
    }
  };

  const handleFileDelete = async (name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const success = await actor.deleteFile(name);
        if (success) {
          await loadFiles();
          setSuccessMessage(`Successfully deleted "${name}"`);
        } else {
          setErrorMessage("Failed to delete file");
        }
      } catch (error) {
        console.error("Delete failed:", error);
        setErrorMessage(`Failed to delete ${name}: ${error.message}`);
      }
    }
  };

  const handleGenerateNFT = async (credentialName) => {
    try {
      const description = `NFT for credential: ${credentialName}`;
      const imageUrl = "https://via.placeholder.com/400x400?text=Credential+NFT";
      const attributes = [
        ["Type", "Credential"],
        ["Name", credentialName],
        ["Verified", "true"]
      ];

      const nftId = await actor.generateCredentialNFT(
        credentialName,
        description,
        imageUrl,
        attributes
      );

      if (nftId && nftId[0]) {
        setSuccessMessage(`NFT generated successfully! ID: ${nftId[0]}`);
      } else {
        setErrorMessage("Failed to generate NFT. Make sure the credential exists.");
      }
    } catch (error) {
      console.error("NFT generation failed:", error);
      setErrorMessage(`Failed to generate NFT: ${error.message}`);
    }
  };

  return (
    <div className="upload-credentials">
      <div className="upload-header">
        <h1 className="page-title">Upload Credentials</h1>
        <p className="page-subtitle">
          Upload your credentials for secure verification and NFT generation
        </p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3>Upload New Credential</h3>
          <p>Select a file to upload and securely store on the Internet Computer</p>
          
          <div className="file-input-wrapper">
            <input
              type="file"
              onChange={handleFileUpload}
              className="file-input"
              id="credential-upload"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="credential-upload" className="file-input-label">
              <span className="file-input-text">Choose File</span>
              <span className="file-input-button">Browse</span>
            </label>
          </div>
          
          <div className="supported-formats">
            <small>Supported formats: PDF, JPG, PNG, DOC, DOCX</small>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="message error-message">
          <div className="message-icon">⚠️</div>
          <div className="message-content">
            <strong>Error:</strong> {errorMessage}
          </div>
          <button onClick={() => setErrorMessage("")} className="message-close">×</button>
        </div>
      )}

      {successMessage && (
        <div className="message success-message">
          <div className="message-icon">✅</div>
          <div className="message-content">
            <strong>Success:</strong> {successMessage}
          </div>
          <button onClick={() => setSuccessMessage("")} className="message-close">×</button>
        </div>
      )}

      {/* Progress */}
      {fileTransferProgress && (
        <div className="progress-section">
          <div className="progress-card">
            <div className="progress-info">
              <span className="progress-mode">{fileTransferProgress.mode}</span>
              <span className="progress-filename">{fileTransferProgress.fileName}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${fileTransferProgress.progress}%` }}
              ></div>
            </div>
            <div className="progress-text">{fileTransferProgress.progress}%</div>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="files-section">
        <div className="section-header">
          <h2 className="section-title">Your Credentials</h2>
          <span className="files-count">{files.length} files</span>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No credentials uploaded yet</h3>
            <p>Upload your first credential to get started with verification and NFT generation.</p>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file, index) => (
              <div key={index} className="file-card">
                <div className="file-header">
                  <div className="file-icon">
                    {file.fileType?.includes('pdf') ? '📄' : 
                     file.fileType?.includes('image') ? '🖼️' : '📋'}
                  </div>
                  <div className="file-menu">
                    <button className="menu-btn">⋮</button>
                  </div>
                </div>
                
                <div className="file-info">
                  <h3 className="file-name">{file.name}</h3>
                  <div className="file-details">
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    <span className="file-type">{file.fileType || 'Unknown'}</span>
                  </div>
                  <div className="file-status">
                    <div className="verification-status">
                      <span className={`status-badge ${file.ecdsa_sign ? 'verified' : 'pending'}`}>
                        {file.ecdsa_sign ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="file-actions">
                  <button
                    onClick={() => handleFileDownload(file.name)}
                    className="action-btn download-btn"
                    title="Download"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  
                  {file.ecdsa_sign && (
                    <button
                      onClick={() => handleGenerateNFT(file.name)}
                      className="action-btn nft-btn"
                      title="Generate NFT"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M2 8h20" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="8" cy="14" r="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 14h2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleFileDelete(file.name)}
                    className="action-btn delete-btn"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCredentials;