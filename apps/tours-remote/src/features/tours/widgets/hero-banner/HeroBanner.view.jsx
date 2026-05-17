import React from "react";
import { Title, SubTitle } from "@packages/trem-ui";

export default function HeroBannerView({ labels, pageTitle }) {
    return (
        <header className="tours-page__header">
            <div className="tours-page__header__left">
                <span className="tours-page__eyebrow">{labels.pageSubtitle || "Find your perfect adventure"}</span>
                <Title text={pageTitle} variant="primary" />
                <SubTitle text={labels.pageDescription || "Browse our curated collection"} variant="primary" size="small" />
            </div>
        </header>
    );
}
