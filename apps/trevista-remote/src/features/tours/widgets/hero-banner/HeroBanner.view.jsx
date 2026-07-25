import React from "react";
import { Title, SubTitle, Icon } from "@packages/trem-ui";

export default function HeroBannerView({ labels, pageTitle }) {
    return (
        <header className="tours-page__header">
            <div className="tours-page__header__left">
                <span className="tours-page__eyebrow">
                    <Icon name="compass" size={14} />
                    {labels.pageSubtitle}
                </span>
                <Title text={pageTitle} variant="primary" size="medium" align="start" />
                {labels.pageDescription && (
                    <SubTitle text={labels.pageDescription} variant="primary" size="small" />
                )}

            </div>
        </header>
    );
}
