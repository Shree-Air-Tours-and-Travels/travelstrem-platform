import React from "react";
import { Button, Icon, Title, Paragraph } from "@packages/trem-ui";
import "./MicroAppError.scss";
import { getConfiguredRemoteOrigin } from "../core/config/portalEnvironment";

const DEFAULT_REMOTE_URL = getConfiguredRemoteOrigin("toursTREM");

export default function MicroAppErrorView({
    title = "Micro app unavailable",
    message = "The requested micro app could not be loaded. Start the remote server and try again.",
    remoteUrl = DEFAULT_REMOTE_URL,
    onRetry,
    openLabel = "Open remote",
}) {
    const remoteEntryUrl = remoteUrl ? `${remoteUrl.replace(/\/$/, "")}/remoteEntry.js` : "";

    return (
        <section className="micro-app-error" role="alert" aria-live="polite">
            <div className="micro-app-error__panel">
                <div className="micro-app-error__icon" aria-hidden="true">
                    <Icon name="alertTriangle" />
                </div>

                <div className="micro-app-error__content">
                    <Paragraph primaryClassname="micro-app-error__eyebrow" text="Micro app load failed" />
                    <Title text={title} />
                    <Paragraph text={message} />

                    {remoteEntryUrl && (
                        <div className="micro-app-error__endpoint">
                            <span>Expected remote</span>
                            <code>{remoteEntryUrl}</code>
                        </div>
                    )}

                    <div className="micro-app-error__actions">
                        <Button variant="solid" color="primary" text="Retry" iconLeft="refreshCw" onClick={onRetry} primaryClassName="micro-app-error__button primary" />

                        {remoteUrl && (
                            <a
                                className="micro-app-error__button secondary"
                                href={remoteUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Icon name="externalLink" aria-hidden="true" />
                                <span>{openLabel}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
