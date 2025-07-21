import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { Principal } from "@dfinity/principal";
import "./verification.css";

const VerificationRequests = () => {
  const { isAuthenticated, actor } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [isVerifier, setIsVerifier] = useState(false);
  const [fileViewProgress, setFileViewProgress] = useState(null);
  const [fileModal, setFileModal] = useState({ 
    isOpen: false, 
    fileUrl: null, 
    fileName: null, 
    fileType: null, 
    isFullPage: false, 
    zoomLevel: 1,
    width: 800,
    height: 600,
    isResizing: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      checkVerifierStatus();
      loadRequests();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!fileModal.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeFileModal();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullPage();
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoom('in');
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoom('out');
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
      }
    };

    if (fileModal.isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [fileModal.isOpen, fileModal.zoomLevel]);

  const checkVerifierStatus = async () => {
    try {
      const verifierStatus = await actor.isCurrentUserVerifier();
      const reviewerStatus = await actor.isCurrentUserReviewer();
      const adminStatus = await actor.isCurrentUserAdmin();
      setIsVerifier(verifierStatus || reviewerStatus || adminStatus);
    } catch (err) {
      console.error("Failed to check verifier status:", err);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsList = await actor.getVerificationPool();
      setRequests(requestsList);
      setError("");
    } catch (err) {
      console.error("Failed to load verification pool:", err);
      setError("Failed to load verification pool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (requestId) => {
    try {
      setLoading(true);
      setError("");
      const success = await actor.claimVerificationRequest(requestId);
      
      if (success) {
        setSuccess("Request claimed successfully!");
        await loadRequests();
      } else {
        setError("Failed to claim request. It may have been claimed by someone else.");
      }
    } catch (err) {
      console.error("Failed to claim request:", err);
      setError("Failed to claim request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      setError("");
      const message = responseMessage || "Verification approved.";
      const success = await actor.processVerificationRequest(requestId, true, message);
      
      if (success) {
        setSuccess("Request approved successfully!");
        await loadRequests();
        setResponseMessage("");
        setActiveRequestId(null);
      } else {
        setError("Failed to approve request. Please make sure you have claimed it first.");
      }
    } catch (err) {
      console.error("Failed to approve request:", err);
      setError("Failed to approve request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      setError("");
      const message = responseMessage || "Verification rejected.";
      const success = await actor.processVerificationRequest(requestId, false, message);
      
      if (success) {
        setSuccess("Request rejected successfully!");
        await loadRequests();
        setResponseMessage("");
        setActiveRequestId(null);
      } else {
        setError("Failed to reject request. Please make sure you have claimed it first.");
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
      setError("Failed to reject request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusString = (status) => {
    if (status.unverified !== undefined) return 'unverified';
    if (status.claimed !== undefined) return 'claimed';
    if (status.verified !== undefined) return 'verified';
    if (status.rejected !== undefined) return 'rejected';
    return 'unknown';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  const handleViewFile = async (request) => {
    try {
      setFileViewProgress({
        mode: "Loading file...",
        fileName: request.credentialName,
        progress: 0,
      });
      
      // Convert submitter to Principal
      const submitterPrincipalStr = typeof request.submitter === 'string' 
        ? request.submitter 
        : (request.submitter.toText ? request.submitter.toText() : String(request.submitter));
      
      const submitterPrincipal = Principal.fromText(submitterPrincipalStr);
      
      // Get file metadata first
      const metadataResult = await actor.getFileMetadataForVerification(
        submitterPrincipal,
        request.credentialName
      );
      
      if (!metadataResult || metadataResult.length === 0) {
        setError("Unable to access file. You may not have permission or the file may not exist.");
        return;
      }

      // Handle optional metadata response - backend returns ?{...} which becomes [data] in frontend
      const actualMetadata = metadataResult[0] || metadataResult;
      
      // Download all chunks
      let chunks = [];
      const totalChunks = Number(actualMetadata.totalChunks);
      
      for (let i = 0; i < totalChunks; i++) {
        const chunkBlob = await actor.getFileChunkForVerification(
          submitterPrincipal,
          request.credentialName,
          BigInt(i)
        );
        
        if (chunkBlob && chunkBlob[0]) {
          chunks.push(chunkBlob[0]);
        } else {
          throw new Error(`Failed to retrieve chunk ${i}`);
        }

        setFileViewProgress((prev) => ({
          ...prev,
          progress: Math.floor(((i + 1) / totalChunks) * 100),
        }));
      }

      // Create and view the file
      const data = new Blob(chunks, { type: actualMetadata.fileType });
      const url = URL.createObjectURL(data);
      
      // Open in modal
      setFileModal({
        isOpen: true,
        fileUrl: url,
        fileName: actualMetadata.name,
        fileType: actualMetadata.fileType,
        isFullPage: false,
        zoomLevel: 1
      });
      
    } catch (error) {
      console.error("View file failed:", error);
      setError(`Failed to view file: ${error.message}`);
    } finally {
      setFileViewProgress(null);
    }
  };

  const closeFileModal = () => {
    if (fileModal.fileUrl) {
      URL.revokeObjectURL(fileModal.fileUrl);
    }
    setFileModal({ 
      isOpen: false, 
      fileUrl: null, 
      fileName: null, 
      fileType: null, 
      isFullPage: false, 
      zoomLevel: 1,
      width: 800,
      height: 600,
      isResizing: false
    });
  };

  const toggleFullPage = () => {
    setFileModal(prev => ({ ...prev, isFullPage: !prev.isFullPage }));
  };

  const handleZoom = (direction) => {
    setFileModal(prev => {
      const newZoom = direction === 'in' 
        ? Math.min(prev.zoomLevel * 1.2, 3) 
        : Math.max(prev.zoomLevel / 1.2, 0.5);
      return { ...prev, zoomLevel: newZoom };
    });
  };

  const resetZoom = () => {
    setFileModal(prev => ({ ...prev, zoomLevel: 1 }));
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setFileModal(prev => ({ ...prev, isResizing: true }));
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = fileModal.width;
    const startHeight = fileModal.height;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(400, startWidth + (e.clientX - startX));
      const newHeight = Math.max(300, startHeight + (e.clientY - startY));
      
      setFileModal(prev => ({
        ...prev,
        width: Math.min(newWidth, window.innerWidth - 40),
        height: Math.min(newHeight, window.innerHeight - 40)
      }));
    };

    const handleMouseUp = () => {
      setFileModal(prev => ({ ...prev, isResizing: false }));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderFilePreview = () => {
    if (!fileModal.fileUrl || !fileModal.fileType) return null;

    const fileType = fileModal.fileType.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      return (
        <div style={{ 
          overflow: 'auto', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          padding: '10px'
        }}>
          <img 
            src={fileModal.fileUrl} 
            alt={fileModal.fileName}
            style={{ 
              maxWidth: fileModal.zoomLevel > 1 ? 'none' : '100%',
              maxHeight: fileModal.zoomLevel > 1 ? 'none' : '100%',
              transform: `scale(${fileModal.zoomLevel})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease',
              display: 'block'
            }}
          />
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <iframe
          src={fileModal.fileUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            transform: `scale(${fileModal.zoomLevel})`,
            transformOrigin: 'top left'
          }}
          title={fileModal.fileName}
        />
      );
    } else if (fileType.startsWith('text/') || fileType === 'application/json') {
      return (
        <iframe
          src={fileModal.fileUrl}
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            transform: `scale(${fileModal.zoomLevel})`,
            transformOrigin: 'top left'
          }}
          title={fileModal.fileName}
        />
      );
    } else if (fileType.startsWith('video/')) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          overflow: 'auto'
        }}>
          <video 
            controls 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              transform: `scale(${fileModal.zoomLevel})`,
              transition: 'transform 0.2s ease'
            }}
          >
            <source src={fileModal.fileUrl} type={fileModal.fileType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else if (fileType.startsWith('audio/')) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <audio controls style={{ width: '100%', maxWidth: '500px' }}>
            <source src={fileModal.fileUrl} type={fileModal.fileType} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    } else {
      // For other file types, provide download link
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p>Preview not available for this file type.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              File type: {fileModal.fileType}
            </p>
          </div>
        </div>
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="verification-container">
        <div className="request-card">
          <div className="empty-state">
            <p>Please sign in to view verification requests.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerifier) {
    return (
      <div className="verification-container">
        <div className="verification-header">
          <h1>Verification Pool</h1>
          <p>Access restricted to verifiers, reviewers, and administrators.</p>
        </div>
        <div className="request-card">
          <div className="empty-state">
            <p>You need verifier, reviewer, or admin privileges to access the verification pool.</p>
            <p>Contact an administrator to get the required permissions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <h1>Verification Pool</h1>
        <p>
          Review and process credential verification requests from users.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {success}
        </div>
      )}

      {fileViewProgress && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>{fileViewProgress.mode}</div>
            <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: 'var(--primary-color)', 
                  width: `${fileViewProgress.progress}%`, 
                  transition: 'width 0.3s ease' 
                }}
              />
            </div>
            <div>{fileViewProgress.progress}%</div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            File: {fileViewProgress.fileName}
          </div>
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <p>Loading verification pool...</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.length === 0 ? (
          <div className="empty-state">
            <p>No verification requests in the pool.</p>
            <p>Requests will appear here when users submit credentials for verification.</p>
          </div>
        ) : (
          requests.map((request) => {
            const statusString = getStatusString(request.status);
            
            return (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h3>Credential: {request.credentialName}</h3>
                    <p>From: {typeof request.submitter === 'string' ? request.submitter.slice(0, 12) : request.submitter.toText().slice(0, 12)}...</p>
                    <p>Submitted: {formatTimestamp(request.submittedAt)}</p>
                    {request.claimedBy && request.claimedBy.length > 0 && (
                      <p>Claimed by: {typeof request.claimedBy === 'string' ? request.claimedBy.slice(0, 12) : (request.claimedBy.toText ? request.claimedBy.toText().slice(0, 12) : String(request.claimedBy).slice(0, 12))}...</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span className={`status-badge status-${statusString}`}>
                      {statusString.charAt(0).toUpperCase() + statusString.slice(1)}
                    </span>
                    {/* Only show View File button for claimed requests */}
                    {(statusString === 'claimed' || statusString === 'verified' || statusString === 'rejected') && (
                      <button
                        onClick={() => handleViewFile(request)}
                        disabled={fileViewProgress !== null}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                        title="View the submitted credential file"
                      >
                        <span style={{ marginRight: '4px' }}>👁️</span>
                        {fileViewProgress && fileViewProgress.fileName === request.credentialName 
                          ? `Loading... ${fileViewProgress.progress}%` 
                          : 'View File'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="request-message">
                  <span className="request-message-label">Request Message:</span>
                  <div className="request-message-content">
                    {request.requestMessage}
                  </div>
                </div>

                {/* Show claim button for unverified requests */}
                {statusString === 'unverified' && (
                  <div className="button-group">
                    <button
                      onClick={() => handleClaim(request.id)}
                      disabled={loading}
                      className="btn btn-respond"
                    >
                      {loading ? "Claiming..." : "Claim Request"}
                    </button>
                  </div>
                )}

                {/* Show approve/reject buttons for claimed requests by this verifier */}
                {statusString === 'claimed' && (
                  <div className="response-section">
                    {activeRequestId === request.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Response Message:
                          </label>
                          <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            className="response-textarea"
                            rows="3"
                            placeholder="Provide your verification decision and any comments..."
                          />
                        </div>
                        <div className="button-group">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={loading}
                            className="btn btn-approve"
                          >
                            {loading ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={loading}
                            className="btn btn-reject"
                          >
                            {loading ? "Processing..." : "Reject"}
                          </button>
                          <button
                            onClick={() => {
                              setActiveRequestId(null);
                              setResponseMessage("");
                              setSuccess("");
                            }}
                            className="btn btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="button-group">
                        <button
                          onClick={() => setActiveRequestId(request.id)}
                          className="btn btn-respond"
                        >
                          Process Request
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Show response for processed requests */}
                {(statusString === 'verified' || statusString === 'rejected') && request.verifierResponse && (
                  <div className="response-section">
                    <span className="request-message-label">
                      Verifier Response:
                    </span>
                    <div className="request-message-content">
                      {request.verifierResponse}
                    </div>
                    {request.processedAt && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                        Processed: {formatTimestamp(request.processedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* File Viewing Modal */}
      {fileModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeFileModal}
        >
          <div
            id="file-modal"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: fileModal.isFullPage ? '0' : '12px',
              maxWidth: fileModal.isFullPage ? '100vw' : '90vw',
              maxHeight: fileModal.isFullPage ? '100vh' : '90vh',
              width: fileModal.isFullPage ? '100vw' : `${fileModal.width}px`,
              height: fileModal.isFullPage ? '100vh' : `${fileModal.height}px`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: fileModal.isFullPage ? 'none' : '1px solid var(--border-color)',
              boxShadow: fileModal.isFullPage ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              cursor: fileModal.isResizing ? 'nw-resize' : 'default'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {fileModal.fileName}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {fileModal.fileType}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Zoom Controls */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleZoom('out')}
                    disabled={fileModal.zoomLevel <= 0.5}
                    className="btn btn-secondary"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 8px',
                      minWidth: 'auto',
                      opacity: fileModal.zoomLevel <= 0.5 ? 0.5 : 1
                    }}
                    title="Zoom Out"
                  >
                    🔍-
                  </button>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    {Math.round(fileModal.zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => handleZoom('in')}
                    disabled={fileModal.zoomLevel >= 3}
                    className="btn btn-secondary"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 8px',
                      minWidth: 'auto',
                      opacity: fileModal.zoomLevel >= 3 ? 0.5 : 1
                    }}
                    title="Zoom In"
                  >
                    🔍+
                  </button>
                  {fileModal.zoomLevel !== 1 && (
                    <button
                      onClick={resetZoom}
                      className="btn btn-secondary"
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '4px 8px',
                        minWidth: 'auto'
                      }}
                      title="Reset Zoom"
                    >
                      1:1
                    </button>
                  )}
                </div>

                {/* Full Page Toggle */}
                <button
                  onClick={toggleFullPage}
                  className="btn btn-secondary"
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={fileModal.isFullPage ? "Exit Full Page" : "Enter Full Page"}
                >
                  {fileModal.isFullPage ? "⛶" : "⛶"} {fileModal.isFullPage ? "Exit" : "Full Page"}
                </button>

                {/* Close */}
                <button
                  onClick={closeFileModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                minHeight: '200px'
              }}
            >
              {renderFilePreview()}
            </div>
            
            {/* Resize Handle */}
            {!fileModal.isFullPage && (
              <div
                onMouseDown={handleResizeStart}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '20px',
                  height: '20px',
                  cursor: 'nw-resize',
                  background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, var(--border-color) 30%, var(--border-color) 35%, transparent 35%, transparent 65%, var(--border-color) 65%, var(--border-color) 70%, transparent 70%)',
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                title="Drag to resize"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;