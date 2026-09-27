import React, { useState, useEffect, useCallback } from "react";
import ManageClientsView from "./ManageClients.view";
import ClientForm from "./ClientForm";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  uploadClientLogo,
  fetchClientMembers,
  assignClientMember,
  removeClientMember,
} from "../../services/adminService";

export default function ManageClients({ embedded = false, isMaster = false }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [memberClient, setMemberClient] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("client_admin");
  const [memberError, setMemberError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchClients();
      setClients(data);
    } catch (err) {
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client) => {
    try {
      await deleteClient(client._id);
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const handleSave = async (payload) => {
    if (editingClient) {
      await updateClient(editingClient._id, payload);
    } else {
      await createClient(payload);
    }
    setShowForm(false);
    setEditingClient(null);
    await load();
  };

  const handleLogoUpload = async (clientId, product, file) => {
    const result = await uploadClientLogo(clientId, product, file);
    setClients((prev) =>
      prev.map((c) =>
        c._id === clientId ? { ...c, branding: result.client?.branding || c.branding } : c,
      ),
    );
  };

  const openMembers = async (client) => {
    setMemberClient(client);
    setMemberError("");
    try {
      setMembers(await fetchClientMembers(client._id));
    } catch (err) {
      setMemberError(err.message || "Failed to load client members");
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    try {
      setMemberError("");
      await assignClientMember(memberClient._id, { email: memberEmail, clientRole: memberRole });
      setMembers(await fetchClientMembers(memberClient._id));
      setMemberEmail("");
    } catch (err) {
      setMemberError(err.message || "Could not assign member");
    }
  };

  const removeMember = async (member) => {
    try {
      setMemberError("");
      await removeClientMember(memberClient._id, member._id);
      setMembers((current) => current.filter((item) => item._id !== member._id));
    } catch (err) {
      setMemberError(err.message || "Could not remove member");
    }
  };

  const content = (
    <>
        <ManageClientsView
          clients={clients}
          loading={loading}
          error={error}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={(c) => setDeleteConfirm(c)}
          onLogoUpload={handleLogoUpload}
          onMembers={isMaster ? openMembers : undefined}
          onRetry={load}
        />
        {showForm && (
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
          />
        )}
        {deleteConfirm && (
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Client</h3>
              <p>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              <div className="modal-actions">
                <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {memberClient && (
          <div className="modal-backdrop" onClick={() => setMemberClient(null)}>
            <div className="modal-content mc-member-modal" role="dialog" aria-modal="true" aria-label={`${memberClient.name} access`} onClick={(event) => event.stopPropagation()}>
              <h3>{memberClient.name} access</h3>
              <p>Only members assigned to this client can open its dashboard.</p>
              {memberError && <p role="alert">{memberError}</p>}
              <form onSubmit={addMember} className="mc-member-form">
                <label>Existing user email<input type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} /></label>
                <label>Role<select value={memberRole} onChange={(event) => setMemberRole(event.target.value)}><option value="client_admin">Client admin</option><option value="client_agent">Client agent</option></select></label>
                <button className="btn btn--primary" type="submit">Assign member</button>
              </form>
              <ul>
                {members.map((member) => <li key={member._id}>{member.name} ({member.email}) · {member.clientRole} <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeMember(member)}>Remove</button></li>)}
              </ul>
              <button className="btn btn--ghost" type="button" onClick={() => setMemberClient(null)}>Close</button>
            </div>
          </div>
        )}
    </>
  );

  if (embedded) return content;
  return <main className="admin-app-shell__main">{content}</main>;
}
