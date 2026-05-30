import React from "react";
import { Icon, StatusBadge, SubTitle, Title, Paragraph } from "@packages/trem-ui";
import pageConfig from "./profilePage.config.json";

export default function ProfilePage({ profile, auth, profileLoading, agencyApplication }) {
    const data = profile || {};
    const joinedDate = auth.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;
    const partnerStatus = agencyApplication?.status || (auth.user?.partnerAgencyRef ? "approved" : null);

    return (
        <section className="agent-main-widget agent-profile-widget">
            <header className="agent-widget-toolbar">
                <SubTitle text={pageConfig.pageTitle} />
            </header>
            <div className="agent-profile-grid">
                <article className="agent-profile-card-large">
                    <span className="agent-profile-card-large__avatar">{(data.name || auth.user?.name || pageConfig.fallbackAvatarInitial).charAt(0).toUpperCase()}</span>
                    <div>
                        <Title text={profileLoading ? pageConfig.loadingText : data.name || auth.user?.name || pageConfig.fallbackName} />
                        <Paragraph text={data.email || auth.user?.email || ""} />
                    </div>
                </article>
                <dl className="agent-profile-summary">
                    {pageConfig.fields.map((field) => {
                        if (field.key === "joined" && !joinedDate) return null;
                        const value = field.key === "joined" ? joinedDate : (data[field.accessor] || field.fallback);
                        return (
                            <div key={field.key}><dt>{field.label}</dt><dd>{value}</dd></div>
                        );
                    })}
                </dl>
            </div>
            {partnerStatus && (
                <div className="agent-partner-status">
                    <Icon name={partnerStatus === "approved" ? "checkCircle" : "clock"} size={18} />
                    <span>{pageConfig.partnerStatus.label} <StatusBadge value={partnerStatus} /></span>
                </div>
            )}
        </section>
    );
}
