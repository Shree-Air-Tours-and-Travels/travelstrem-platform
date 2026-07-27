import React from "react";
import { Button, SubTitle } from "@packages/trem-ui";
import "./AgenciesTabWidget.scss";

export default function AgenciesTabWidget({
    admins, agents, partnerAgencies, agencyLoading, auth,
    fetchAgencyManagement, handleReviewAdmin, handleRemoveAdmin,
    handleReviewAgent, handleReviewPartnerAgency, hideHeader = false,
}) {
    return (
        <section className="mt-content agency-management">
            {!hideHeader && (
                <header className="mt-toolbar agency-management__header">
                    <div>
                        <SubTitle text="Agency Management" />
                        <p>Review access requests and manage partner accounts.</p>
                    </div>
                    <Button primaryClassName="btn agency-button" variant="outline" onClick={fetchAgencyManagement} text="Refresh" />
                </header>
            )}

            {agencyLoading ? <div className="mt-empty">Loading agency approvals...</div> : null}

            <div className="mt-grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
                {auth?.user?.adminLevel === "master" && (
                    <article className="mt-empty" style={{ textAlign: "left" }}>
                        <SubTitle text="Admin Approvals" />
                        {(admins || []).length === 0 ? <p>No admins found.</p> : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {admins.map((admin) => {
                                    const id = admin.id || admin._id;
                                    const isMaster = admin.adminLevel === "master";
                                    const isSelf = id && auth?.user?.id && String(id) === String(auth.user.id);
                                    return (
                                        <div key={id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", border: "1px solid #dbe7e4", borderRadius: 8, padding: 12 }}>
                                            <div>
                                                <strong>{admin.name}</strong>
                                                <div>{admin.email} {admin.phone ? `· ${admin.phone}` : ""}</div>
                                                <small>level: {admin.adminLevel || "standard"} · status: {admin.adminApprovalStatus || "pending"}</small>
                                            </div>
                                            <div className="mt-actions">
                                                {!isMaster && admin.adminApprovalStatus !== "approved" && (
                                                    <Button primaryClassName="btn agency-button agency-button--approve" variant="solid" onClick={() => handleReviewAdmin(id, "approved")} text="Approve" />
                                                )}
                                                {!isMaster && admin.adminApprovalStatus !== "rejected" && (
                                                    <Button primaryClassName="btn agency-button agency-button--danger" variant="outline" color="danger" onClick={() => handleReviewAdmin(id, "rejected")} text="Reject" />
                                                )}
                                                {!isMaster && !isSelf && admin.adminApprovalStatus !== "removed" && (
                                                    <Button primaryClassName="btn agency-button agency-button--danger" variant="outline" color="danger" onClick={() => handleRemoveAdmin(id)} text="Remove" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </article>
                )}

                <article className="mt-empty" style={{ textAlign: "left" }}>
                    <SubTitle text="Pending / Registered Agents" />
                    {(agents || []).length === 0 ? <p>No agents found.</p> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {agents.map((agent) => (
                                <div key={agent.id || agent._id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", border: "1px solid #dbe7e4", borderRadius: 8, padding: 12 }}>
                                    <div>
                                        <strong>{agent.name}</strong>
                                        <div>{agent.email}</div>
                                        <small>agentRef: {agent.agentRef || "-"} · agencyRef: {agent.partnerAgencyRef || agent.agencyRef || "-"} · status: {agent.agentApprovalStatus}</small>
                                    </div>
                                    <div className="mt-actions">
                                        <Button primaryClassName="btn agency-button agency-button--approve" variant="solid" onClick={() => handleReviewAgent(agent.id || agent._id, "approved")} text="Approve" />
                                        <Button primaryClassName="btn agency-button agency-button--danger" variant="outline" color="danger" onClick={() => handleReviewAgent(agent.id || agent._id, "rejected")} text="Reject" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="mt-empty" style={{ textAlign: "left" }}>
                    <SubTitle text="Partner Agency Applications" />
                    {(partnerAgencies || []).length === 0 ? <p>No partner agency applications found.</p> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {partnerAgencies.map((agency) => (
                                <div key={agency.id || agency._id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", border: "1px solid #dbe7e4", borderRadius: 8, padding: 12 }}>
                                    <div>
                                        <strong>{agency.agencyName}</strong>
                                        <div>{agency.contactName || "No contact"} · {agency.contactEmail || "No email"}</div>
                                        <small>partnerAgencyRef: {agency.partnerAgencyRef} · status: {agency.status}</small>
                                    </div>
                                    <div className="mt-actions">
                                        <Button primaryClassName="btn agency-button agency-button--approve" variant="solid" onClick={() => handleReviewPartnerAgency(agency.id || agency._id, "approved")} text="Approve" />
                                        <Button primaryClassName="btn agency-button agency-button--danger" variant="outline" color="danger" onClick={() => handleReviewPartnerAgency(agency.id || agency._id, "rejected")} text="Reject" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </div>
        </section>
    );
}
