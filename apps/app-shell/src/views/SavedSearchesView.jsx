import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import { DashboardPanel, NoDataFound, Preloader } from "@packages/trem-ui";

import "./SavedSearchesView.scss";

export default function SavedSearchesView({ isAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData("/saved-searches");
      if (response.status !== "success") throw new Error(response.message || "Unable to load saved searches.");
      setItems(response.data || []);
    } catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);
  const remove = async (id) => {
    setRemoving(id);
    setError("");
    try {
      const response = await fetchData(`/saved-searches/${id}`, { method: "DELETE" });
      if (response.status !== "success") throw new Error(response.message || "Unable to remove saved search.");
      setItems((current) => current.filter((item) => item._id !== id));
      window.dispatchEvent(new Event("saved-searches:changed"));
    } catch (failure) { setError(failure.message); }
    finally { setRemoving(null); }
  };
  if (!isAuthenticated) return <NoDataFound title="Sign in to view saved searches" />;
  return <section>
    <h1>Saved searches</h1>
    <p>Searches from Home are saved while you are signed in. Reopen one to check current availability and prices.</p>
    {error ? <NoDataFound title="Saved searches unavailable" description={error} actionLabel="Try again" onAction={load} compact /> : null}
    {loading ? <Preloader variant="grid" count={3} label="Loading saved searches" /> : null}
    {!loading && !error && !items.length ? <NoDataFound title="No saved searches yet" description="Start a search from Home to save your travel plans here." actionLabel="Explore travel" onAction={() => navigate("/?tab=overview")} /> : null}
    <div className="saved-searches-grid">
      {items.map((item) => <DashboardPanel key={item._id} title={item.title} icon="search"
        description={`Saved ${new Date(item.updatedAt).toLocaleDateString()}`}
        action={{ label: removing === item._id ? "Removing…" : "Remove", onClick: () => { if (!removing) remove(item._id); } }}
        items={[{ id: item._id, label: "Search again", target: `${item.path}?${item.query}`, icon: "arrowUpRight" }]}
        onItemClick={(path) => navigate(path, { state: location.state })} />)}
    </div>
  </section>;
}
