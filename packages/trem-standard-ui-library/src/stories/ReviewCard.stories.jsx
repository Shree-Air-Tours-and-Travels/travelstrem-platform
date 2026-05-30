import React from "react";
import { ReviewCard } from "@packages/trem-ui";

const sampleReviews = [
  {
    _id: "1",
    name: "Priya Sharma",
    profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    review: "Amazing experience! The Himalayan trek was beautifully organized. Our guide was knowledgeable and the views were breathtaking.",
    rating: 4.8,
  },
  {
    _id: "2",
    name: "Rahul Verma",
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    review: "Great service and fantastic itinerary. Every detail was taken care of. Highly recommend for anyone looking to explore India.",
    rating: 4.5,
  },
  {
    _id: "3",
    name: "Ananya Patel",
    profilePic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    review: "A wonderful journey through Kerala's backwaters. The houseboat experience was unforgettable. Will definitely book again!",
    rating: 5.0,
  },
];

export default {
  title: "Trem UI/Data Display/ReviewCard",
  component: ReviewCard,
  tags: ["autodocs"],
  argTypes: {
    review: { control: "object" },
  },
  args: {
    review: sampleReviews[0],
  },
};

export const Playground = {};

export const Default = {
  name: "Default",
  render: () => (
    <ReviewCard review={sampleReviews[0]} />
  ),
};

export const HighRating = {
  name: "High Rating",
  render: () => (
    <ReviewCard review={sampleReviews[2]} />
  ),
};

export const Gallery = {
  name: "Review Gallery",
  render: () => (
    <div className="trem-storybook-stack">
      {sampleReviews.map((r) => (
        <ReviewCard key={r._id} review={r} />
      ))}
    </div>
  ),
};
