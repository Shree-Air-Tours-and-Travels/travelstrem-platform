import React, { useState, useEffect, useCallback } from "react";
import ManageClientsView from "./ManageClients.view";
import ClientForm from "./ClientForm";
import Sidebar from "../../components/AdminSidebar";
import { fetchClients, createClient, updateClient, deleteClient, uploadClientLogo } from "../../services/adminService";

export default function ManageClients({ session }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  useEffect(() => { load(); }, [load]);

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
      prev.map((c) => (c._id === clientId ? { ...c, branding: result.client?.branding || c.branding } : c))
    );
  };

  return (
    <div className="admin-app-shell__layout">
      <Sidebar activeTab="clients" onTabChange={() => {}} user={session?.user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main className="admin-app-shell__main">
        <ManageClientsView
          clients={clients}
          loading={loading}
          error={error}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={(c) => setDeleteConfirm(c)}
          onLogoUpload={handleLogoUpload}
          onRetry={load}
        />
        {showForm && (
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingClient(null); }}
          />
        )}
        {deleteConfirm && (
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Client</h3>
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
              <div className="modal-actions">
                <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
