import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./admin.css";

const AdminPanel = () => {
  const { actor } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newUserPrincipal, setNewUserPrincipal] = useState("");
  const [selectedRole, setSelectedRole] = useState("verifier");

  useEffect(() => {
    checkAdminStatus();
    if (actor) {
      loadUsers();
    }
  }, [actor]);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await actor.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        setError("You don't have admin privileges to access this page.");
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status.");
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const userList = await actor.listUsersWithRoles();
      setUsers(userList);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load user list.");
    }
  };

  const claimSuperAdmin = async () => {
    try {
      const success = await actor.claimSuperAdmin();
      if (success) {
        setSuccess("Successfully claimed super admin status!");
        setIsAdmin(true);
        await loadUsers();
      } else {
        setError("Failed to claim super admin status. There may already be a super admin.");
      }
    } catch (err) {
      console.error("Error claiming super admin:", err);
      setError("Failed to claim super admin status.");
    }
  };

  const assignRole = async () => {
    if (!newUserPrincipal.trim()) {
      setError("Please enter a valid principal ID.");
      return;
    }

    try {
      // Convert string role to proper variant format
      let roleVariant;
      switch (selectedRole) {
        case "admin":
          roleVariant = { admin: null };
          break;
        case "verifier":
          roleVariant = { verifier: null };
          break;
        case "reviewer":
          roleVariant = { reviewer: null };
          break;
        default:
          roleVariant = { user: null };
      }

      const result = await actor.assignUserRole(newUserPrincipal.trim(), roleVariant);
      if (result) {
        setSuccess(`Successfully assigned ${selectedRole} role to user!`);
        setNewUserPrincipal("");
        await loadUsers();
      } else {
        setError("Failed to assign role. Make sure the principal ID is valid.");
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      setError("Failed to assign role to user.");
    }
  };

  const revokeRole = async (userPrincipal) => {
    try {
      const result = await actor.revokeUserRole(userPrincipal);
      if (result) {
        setSuccess("Successfully revoked user role!");
        await loadUsers();
      } else {
        setError("Failed to revoke user role.");
      }
    } catch (err) {
      console.error("Error revoking role:", err);
      setError("Failed to revoke user role.");
    }
  };

  const formatRole = (role) => {
    if (typeof role === 'object') {
      return Object.keys(role)[0];
    }
    return role;
  };

  const formatPrincipal = (principal) => {
    const principalStr = principal.toString();
    return principalStr.length > 20 
      ? `${principalStr.substring(0, 10)}...${principalStr.substring(principalStr.length - 10)}`
      : principalStr;
  };

  const formatDate = (timestamp) => {
    if (timestamp === 0) return "N/A";
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
        </div>
        
        <div className="error-message">
          {error}
        </div>

        <div className="claim-admin-section">
          <h3>Claim Super Admin Status</h3>
          <p>If no super admin exists yet, you can claim super admin privileges:</p>
          <button onClick={claimSuperAdmin} className="btn btn-primary">
            Claim Super Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage user roles and permissions</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError("")} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess("")} className="close-btn">×</button>
        </div>
      )}

      <div className="assign-role-section">
        <h3>Assign Role to User</h3>
        <div className="form-group">
          <label htmlFor="principalInput">User Principal ID:</label>
          <input
            id="principalInput"
            type="text"
            value={newUserPrincipal}
            onChange={(e) => setNewUserPrincipal(e.target.value)}
            placeholder="Enter principal ID (e.g., rdmx6-jaaaa-aaaaa-aaadq-cai)"
            className="principal-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="roleSelect">Role:</label>
          <select
            id="roleSelect"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-select"
          >
            <option value="verifier">Verifier</option>
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button onClick={assignRole} className="btn btn-primary">
          Assign Role
        </button>
      </div>

      <div className="users-section">
        <h3>Users with Roles</h3>
        {users.length === 0 ? (
          <p>No users with assigned roles found.</p>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <div className="col-principal">Principal</div>
              <div className="col-role">Role</div>
              <div className="col-assigned">Assigned By</div>
              <div className="col-date">Date</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>
            {users.map((user, index) => (
              <div key={index} className="table-row">
                <div className="col-principal" title={user.principal.toString()}>
                  {formatPrincipal(user.principal)}
                </div>
                <div className="col-role">
                  <span className={`role-badge role-${formatRole(user.role)}`}>
                    {formatRole(user.role)}
                  </span>
                </div>
                <div className="col-assigned" title={user.assignedBy.toString()}>
                  {formatPrincipal(user.assignedBy)}
                </div>
                <div className="col-date">
                  {formatDate(user.assignedAt)}
                </div>
                <div className="col-status">
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-actions">
                  {user.isActive && formatRole(user.role) !== 'admin' && (
                    <button
                      onClick={() => revokeRole(user.principal)}
                      className="btn btn-danger btn-small"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;