import React, { useState } from "react";
import { TrevioTripCard } from "@packages/trem-ui";

const trip = {
  id: "manali",
  title: "Manali Adventure Escape",
  category: "Mountains",
  location: "Himachal Pradesh",
  duration: "4D / 3N",
  price: 12999,
  tag: "Mountain escape",
  rating: "4.9",
  image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
  desc: "Snowy peaks, riverside cafés, Solang thrills and an unforgettable group journey.",
  chips: ["Volvo transfer", "Hotel stay", "Breakfast + dinner"],
};

export default { title: "Trevio/Trip Card", component: TrevioTripCard, tags: ["autodocs"] };

export const Default = {
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return <div style={{ maxWidth: 380 }}><TrevioTripCard trip={trip} favorited={favorited} onFavorite={() => setFavorited((value) => !value)} onView={() => {}} /></div>;
  },
};

export const CardGrid = {
  render: () => <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(260px, 1fr))", gap: 20 }}>
    {[trip, { ...trip, id: "rishikesh", title: "Rishikesh Rush Weekend", category: "Weekend", rating: "4.8" }, { ...trip, id: "spiti", title: "Spiti Road Expedition", category: "Road trips", rating: "4.9" }].map((item) => <TrevioTripCard key={item.id} trip={item} onView={() => {}} />)}
  </div>,
};
