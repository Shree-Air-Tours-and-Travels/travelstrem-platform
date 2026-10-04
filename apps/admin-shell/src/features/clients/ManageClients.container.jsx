import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ManageClientsView from "./ManageClients.view";
import {
  fetchClients,
  deleteClient,
  uploadClientLogo,
  fetchClientMembers,
  assignClientMember,
  removeClientMember,
} from "../../services/adminService";

export default function ManageClients({ embedded = false, isMaster = false }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [memberClient, setMemberClient] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("client_admin");
  const [memberError, setMemberError] = useState("");
  const [memberMessage, setMemberMessage] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);

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
    navigate("/manage/clients/build");
  };

  const handleEdit = (client) => {
    navigate(`/manage/clients/build?clientId=${encodeURIComponent(client._id)}`);
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
    setMembers([]);
    setMemberError("");
    setMemberMessage("");
    try {
      setMembers(await fetchClientMembers(client._id));
    } catch (err) {
      setMemberError(err.message || "Failed to load client members");
    }
  };

  const addMember = async (event, member) => {
    event?.preventDefault();
    if (memberBusy) return;
    setMemberBusy(true); setMemberMessage("");
    try {
      setMemberError("");
      const response = await assignClientMember(memberClient._id, { email: member?.email || memberEmail, clientRole: member?.clientRole || memberRole });
      const result = response.componentData.data;
      setMemberMessage(result.alreadyActive ? "Access updated for this active account." : result.emailSent ? "Activation invitation sent." : "Access saved, but email delivery failed. Resend the activation invitation.");
      setMembers(await fetchClientMembers(memberClient._id));
      setMemberEmail("");
    } catch (err) {
      setMemberError(err.message || "Could not assign member");
    } finally { setMemberBusy(false); }
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
        {deleteConfirm && (
          <div className="mc-dialog-backdrop" onClick={() => setDeleteConfirm(null)}>
            <div className="mc-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Deactivate Client</h3>
              <p>
                Are you sure you want to deactivate <strong>{deleteConfirm.name}</strong>?
              </p>
              <div className="mc-dialog__actions">
                <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
        {memberClient && (
          <div className="mc-dialog-backdrop" onClick={() => setMemberClient(null)}>
            <div className="mc-dialog mc-member-modal" role="dialog" aria-modal="true" aria-labelledby="mc-access-title" onClick={(event) => event.stopPropagation()}>
              <div className="mc-dialog__heading"><div><h3 id="mc-access-title">Manage access</h3><p>{memberClient.name}</p></div><button className="btn btn--ghost btn--sm" type="button" onClick={() => setMemberClient(null)} aria-label="Close access dialog">Close</button></div>
              <p>Invite a member or assign an existing account to this client's dashboard.</p>
              {memberError && <p className="mc-dialog__error" role="alert">{memberError}</p>}
              {memberMessage && <p className="mc-dialog__success" role="status">{memberMessage}</p>}
              <form onSubmit={addMember} className="mc-member-form">
                <label>Member email<input type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} /></label>
                <label>Role<select value={memberRole} onChange={(event) => setMemberRole(event.target.value)}><option value="client_master_admin">Client master admin</option><option value="client_admin">Client admin</option><option value="client_agent">Client agent</option></select></label>
                <button className="btn btn--primary" type="submit" disabled={memberBusy}>Invite / assign member</button>
              </form>
              <h4>Members with access</h4>
              {members.length ? <ul className="mc-member-list">
                {members.map((member) => <li key={member._id}><div><strong>{member.name || member.email}</strong><span>{member.email} · {member.clientRole.replaceAll('_', ' ')} · {member.accountStatus}</span></div><div>{member.accountStatus === "invited" && <button className="btn btn--ghost btn--sm" type="button" disabled={memberBusy} onClick={() => addMember(null, member)}>Resend activation</button>} <button type="button" className="btn btn--ghost btn--sm" disabled={memberBusy} onClick={() => removeMember(member)}>Remove</button></div></li>)}
              </ul> : <p className="mc-member-empty">No members assigned yet.</p>}
            </div>
          </div>
        )}
    </>
  );

  if (embedded) return content;
  return <main className="admin-app-shell__main">{content}</main>;
}
