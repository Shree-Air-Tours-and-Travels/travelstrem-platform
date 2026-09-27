import React, { useState } from "react";
import { HotelCard } from "@packages/trem-ui";

const hotel = {
  id: "demo-hotel", title: "The Jaipur Garden", subtitle: "Civil Lines, Jaipur",
  image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  imageAlt: "Hotel pool and garden", badge: { value: "5 stars" }, rating: "9.2",
  description: "A quiet garden stay with spacious rooms and breakfast included.",
  amenities: ["Wi-Fi", "Pool", "Restaurant", "Parking"],
  price: { labelRef: "stayPrice", value: "₹12,540" },
  staySummary: "2 nights · 1 room · 2 guests", actionLabelRef: "viewHotel",
};
const labels = { stayPrice: "Total for your stay", priceIncludesFees: "Includes taxes and convenience fee", viewHotel: "View hotel", unavailable: "Unavailable", popular: "Popular choice", rating: "Guest rating", addFavorite: "Save hotel", removeFavorite: "Remove saved hotel", loading: "Loading hotel" };

export default {
  title: "Trem UI/Cards/HotelCard", component: HotelCard, tags: ["autodocs"],
  args: { hotel, labels, onView: () => {}, variant: "full" },
  argTypes: { variant: { control: "select", options: ["full", "compact", "vertical"] }, onView: { action: "viewHotel" }, onFavorite: { action: "favoriteChanged" } },
  decorators: [(Story) => <div style={{ maxWidth: 1100, margin: "auto" }}><Story /></div>],
};

export const Full = {};
export const Compact = { args: { variant: "compact" } };
export const Vertical = { args: { variant: "vertical" }, decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>] };
export const Disabled = { args: { disabled: true } };
export const Hidden = { args: { hidden: true } };
export const Popular = { args: { popular: true } };
export const Favorite = {
  args: { showFavorite: true, favorite: true },
  render: function FavoriteExample(args) {
    const [favorite, setFavorite] = useState(args.favorite);
    return <HotelCard {...args} favorite={favorite} onFavorite={(item, value) => { setFavorite(value); args.onFavorite?.(item, value); }} />;
  },
};
export const DisabledFavorite = { args: { disabled: true, showFavorite: true, favorite: true, onFavorite: () => {} } };
export const PopularFavorite = { ...Favorite, args: { ...Favorite.args, popular: true } };
export const HiddenPrice = { args: { hidePrice: true } };
export const HiddenAction = { args: { hideAction: true } };
export const HiddenPriceAndAction = { args: { hidePrice: true, hideAction: true } };
export const NoImage = { args: { hideImage: true } };
export const Minimal = { args: { hotel: { ...hotel, amenities: [], description: "", rating: null, badge: null }, hideImage: true } };
export const Loading = { args: { loading: true } };
export const LongContent = { args: { hotel: { ...hotel, title: "The Grand Heritage Garden Palace and Riverside Retreat", subtitle: "A longer address with neighbourhood, city and regional information", price: { ...hotel.price, value: "₹1,25,400.50" } } } };
export const Mobile = { parameters: { viewport: { defaultViewport: "mobile1" } }, decorators: [(Story) => <div style={{ maxWidth: 375 }}><Story /></div>] };
