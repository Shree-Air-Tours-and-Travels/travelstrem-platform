import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, EmptyState, Icon, Paragraph, PortalPreloader, QuickChips, Title, TourCard } from "@packages/trem-ui";
import { fetchData, getTourDetailsPath, slugify } from "@packages/trem-utils";
import { getLabel } from "./_helpers";

export default function FavoritesTourList({ labels, favoritesState, favoritesChips, loadFavorites }) {
    const navigate = useNavigate();
    const [activeChip, setActiveChip] = useState("tours");
    const [sort, setSort] = useState("recommended");
    const { loading, error, items: favorites } = favoritesState;

    const handleChipClick = (chipId) => {
        const chip = favoritesChips.find((c) => c.id === chipId);
        if (!chip || chip.disabled) return;
        setActiveChip(chipId);
    };

    const openTour = useCallback(
        (tour) => {
            const ref = slugify(tour?.title) || tour?._id || tour?.id;
            if (!ref) return;
            navigate(getTourDetailsPath(ref), { state: { tour, from: { label: "Dashboard", path: "/dashboard" } } });
        },
        [navigate]
    );

    const sorted = [...favorites].sort((a, b) => {
        if (sort === "price-asc") return (a.price?.min || 0) - (b.price?.min || 0);
        if (sort === "price-desc") return (b.price?.min || 0) - (a.price?.min || 0);
        if (sort === "rating") return (b.avgRating || 0) - (a.avgRating || 0);
        return 0;
    });

    if (loading) {
        return (
            <section className="dashboard-favorites">
                <div className="dashboard-favorites__container">
                    <PortalPreloader type="cards" count={3} text={getLabel(labels, "favoritesLoading", "Loading favorites")} />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-favorites">
                <div className="dashboard-favorites__container">
                    <div className="dashboard-favorites__error">
                        <Icon name="alertTriangle" size={24} />
                        <Paragraph>{error}</Paragraph>
                        <Button variant="solid" color="primary" text={getLabel(labels, "retry", "Try again")} onClick={loadFavorites} primaryClassName="dashboard-favorites__retry" />
                    </div>
                </div>
            </section>
        );
    }

    const hasFavorites = favorites.length > 0;

    return (
        <section className="dashboard-favorites">
            <div className="dashboard-favorites__container">
                <header className="dashboard-favorites__header">
                    <Title primaryClassname="dashboard-favorites__title" text={getLabel(labels, "favoritesTitle", "My Favorites")} />
                    {hasFavorites && <span className="dashboard-favorites__count">{favorites.length} {getLabel(labels, "favoritesSaved", "saved")}</span>}
                    <select className="dashboard-favorites__sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tours">
                        <option value="recommended">{getLabel(labels, "navRecommended", "Recommended")}</option>
                        <option value="price-asc">{getLabel(labels, "navPriceLow", "Price: Low to High")}</option>
                        <option value="price-desc">{getLabel(labels, "navPriceHigh", "Price: High to Low")}</option>
                        <option value="rating">{getLabel(labels, "navTopRated", "Top Rated")}</option>
                    </select>
                </header>

                <QuickChips
                    filters={favoritesChips}
                    activeId={activeChip}
                    onClick={handleChipClick}
                    className="dashboard-favorites__chips"
                />

                {!hasFavorites ? (
                    <EmptyState
                        icon="heart"
                        title={getLabel(labels, "favoritesEmptyTitle", "No favorites yet")}
                        description={getLabel(labels, "favoritesEmptyDescription", "Start exploring tours and save the ones you love. Your favorites will appear here.")}
                    />
                ) : (
                    <div className="dashboard-favorites__grid">
                        {activeChip === "tours" && sorted.map((tour) => (
                            <TourCard key={tour._id || tour.id} tour={tour} variant="grid" onView={openTour} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
