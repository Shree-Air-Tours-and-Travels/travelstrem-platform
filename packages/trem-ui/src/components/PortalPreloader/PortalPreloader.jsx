import React from "react";
import "./PortalPreloader.styles.scss";

export default function PortalPreloader({ type = "cards", count = 4, text = "" }) {
    if (type === "app") {
        return (
            <div className="portal-preloader portal-preloader--app" role="status" aria-live="polite">
                <div className="portal-preloader__panel">
                    <div className="portal-preloader__line portal-preloader__line--title" />
                    <div className="portal-preloader__line portal-preloader__line--short" />
                    {text && <p>{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <section className={`portal-preloader portal-preloader--${type}`} role="status" aria-live="polite">
            {text && <p className="portal-preloader__text">{text}</p>}
            <div className="portal-preloader__grid">
                {Array.from({ length: count }).map((_, index) => (
                    <div className="portal-preloader__card" key={index}>
                        <div className="portal-preloader__media" />
                        <div className="portal-preloader__body">
                            <div className="portal-preloader__line portal-preloader__line--title" />
                            <div className="portal-preloader__line" />
                            <div className="portal-preloader__line portal-preloader__line--short" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
