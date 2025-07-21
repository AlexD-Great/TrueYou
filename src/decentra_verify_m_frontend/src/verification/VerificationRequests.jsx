import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./verification.css";

const VerificationRequests = () => {
  const { isAuthenticated, actor } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [activeRequestId, setActiveRequestId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadRequests();
    }
  }, [isAuthenticated]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsList = await actor.getVerificationRequests();
      setRequests(requestsList);
      setError("");
    } catch (err) {
      console.error("Failed to load verification requests:", err);
      setError("Failed to load verification requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      const message = responseMessage || "Verification request approved.";
      const success = await actor.approveVerificationRequest(requestId, message);
      
      if (success) {
        await loadRequests();
        setResponseMessage("");
        setActiveRequestId(null);
      } else {
        setError("Failed to approve request. Please try again.");
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
      const message = responseMessage || "Verification request rejected.";
      const success = await actor.rejectVerificationRequest(requestId, message);
      
      if (success) {
        await loadRequests();
        setResponseMessage("");
        setActiveRequestId(null);
      } else {
        setError("Failed to reject request. Please try again.");
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
      setError("Failed to reject request. Please try again.");
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
    if (status.pending !== undefined) return "Pending";
    if (status.approved !== undefined) return "Approved";
    if (status.rejected !== undefined) return "Rejected";
    return "Unknown";
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <div className="mt-4 rounded-md border-l-4 bg-neutral-200 p-4 shadow-md">
          <p className="mt-2 text-black">
            Please sign in to view verification requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Verification Requests</h1>
        <p className="text-gray-600">
          Manage requests from organizations wanting to verify your credentials.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 text-center">
          <p className="text-gray-600">Loading verification requests...</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No verification requests found.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Credential: {request.credentialName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    From: {request.requester.toText()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Requested: {formatTimestamp(request.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    getStatusText(request.status)
                  )}`}
                >
                  {getStatusText(request.status)}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Request Message:
                </p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                  {request.requestMessage}
                </p>
              </div>

              {getStatusText(request.status) === "Pending" && (
                <div className="border-t pt-4">
                  {activeRequestId === request.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Response Message (Optional):
                        </label>
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                          placeholder="Add a message with your response..."
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={loading}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
                        >
                          {loading ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={loading}
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                        >
                          {loading ? "Processing..." : "Reject"}
                        </button>
                        <button
                          onClick={() => {
                            setActiveRequestId(null);
                            setResponseMessage("");
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveRequestId(request.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Respond to Request
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VerificationRequests;