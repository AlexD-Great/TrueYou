import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { Principal } from "@dfinity/principal";
import "./verification.css";

const RequestVerification = () => {
  const { isAuthenticated, actor } = useAuth();
  const [holderPrincipal, setHolderPrincipal] = useState("");
  const [credentialName, setCredentialName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sentRequests, setSentRequests] = useState([]);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSentRequests();
      loadResponses();
    }
  }, [isAuthenticated]);

  const loadSentRequests = async () => {
    try {
      const requests = await actor.getSentVerificationRequests();
      setSentRequests(requests);
    } catch (err) {
      console.error("Failed to load sent requests:", err);
    }
  };

  const loadResponses = async () => {
    try {
      const responsesList = await actor.getVerificationResponses();
      setResponses(responsesList);
    } catch (err) {
      console.error("Failed to load responses:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!holderPrincipal || !credentialName || !requestMessage) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const holderPrincipalObj = Principal.fromText(holderPrincipal);
      const requestId = await actor.createVerificationRequest(
        holderPrincipalObj,
        credentialName,
        requestMessage
      );
      
      setSuccess(`Verification request sent successfully! Request ID: ${requestId}`);
      setHolderPrincipal("");
      setCredentialName("");
      setRequestMessage("");
      
      // Reload sent requests
      await loadSentRequests();
    } catch (err) {
      console.error("Failed to send verification request:", err);
      setError("Failed to send verification request. Please check the Principal ID format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    if (status.pending !== undefined) return "pending";
    if (status.approved !== undefined) return "approved";
    if (status.rejected !== undefined) return "rejected";
    return "unknown";
  };

  const getResponseForRequest = (requestId) => {
    return responses.find(response => response.requestId === requestId);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <div className="mt-4 rounded-md border-l-4 bg-neutral-200 p-4 shadow-md">
          <p className="mt-2 text-black">
            Please sign in to request credential verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Request Credential Verification</h1>
        <p className="text-gray-600">
          Request verification of credentials from document holders.
        </p>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">New Verification Request</h2>
        
        {error && (
          <div className="mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-green-400 bg-green-100 p-3 text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential Holder Principal ID *
            </label>
            <input
              type="text"
              value={holderPrincipal}
              onChange={(e) => setHolderPrincipal(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the Principal ID of the credential holder"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              The Principal ID of the person whose credentials you want to verify.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential Name *
            </label>
            <input
              type="text"
              value={credentialName}
              onChange={(e) => setCredentialName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the name of the credential file"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              The exact filename of the credential you want to verify.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Message *
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              placeholder="Explain why you need to verify this credential..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide context about your verification request to help the holder understand your purpose.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 font-medium"
          >
            {loading ? "Sending Request..." : "Send Verification Request"}
          </button>
        </form>
      </div>

      {/* Sent Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sent Requests</h2>
        
        {sentRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No verification requests sent yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((request) => {
              const response = getResponseForRequest(request.id);
              const status = getStatusText(request.status);
              
              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.credentialName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        To: {request.holder.toText()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Sent: {formatTimestamp(request.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Your Request:
                    </p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm">
                      {request.requestMessage}
                    </p>
                  </div>

                  {response && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Response ({formatTimestamp(response.respondedAt)}):
                      </p>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm mb-3">
                        {response.responseMessage}
                      </p>
                      
                      {response.approved && response.credentialData && (
                        <div className="bg-green-50 p-4 rounded-md">
                          <h4 className="font-semibold text-green-800 mb-2">
                            Verification Data:
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><strong>File:</strong> {response.credentialData.name}</p>
                            <p><strong>Type:</strong> {response.credentialData.fileType}</p>
                            <p><strong>Size:</strong> {response.credentialData.size} bytes</p>
                            <p><strong>ECDSA Signature:</strong> 
                              <span className="font-mono text-xs ml-2">
                                {response.credentialData.ecdsa_sign.slice(0, 20)}...
                              </span>
                            </p>
                            <p><strong>Schnorr Signature:</strong> 
                              <span className="font-mono text-xs ml-2">
                                {response.credentialData.schnorr_sign.slice(0, 20)}...
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestVerification;