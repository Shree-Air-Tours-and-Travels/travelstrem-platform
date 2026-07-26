import React from "react";
import "./FavoriteCard.scss";

export default function FavoriteCard({ item, onRemove, onView }) {
  const name = item?.name || item?.title || "Untitled";
  const location = item?.location || item?.destination || "";
  const price = item?.price?.amount || item?.price || null;
  const image = item?.image || item?.images?.[0] || "";

  return (
    <div className="dfc">
      <div className="dfc__image">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <div className="dfc__placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="dfc__body">
        <h4 className="dfc__name">{name}</h4>
        {location && <p className="dfc__location">{location}</p>}
        {price && <p className="dfc__price">₹{typeof price === "number" ? price.toLocaleString() : price}</p>}
      </div>
      <div className="dfc__actions">
        {onView && (
          <button className="dfc__btn dfc__btn--view" onClick={() => onView(item)}>View</button>
        )}
        {onRemove && (
          <button className="dfc__btn dfc__btn--remove" onClick={() => onRemove(item)} title="Remove">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
