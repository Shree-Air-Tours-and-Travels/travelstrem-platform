import React, { useState } from "react";
import ReviewsView from "./Reviews.view";
import user from "../../shared/assets/images/user.png";

const reviewsData = [
    {
        id: 1,
        profilePic: user,
        name: "Alice Johnson",
        review: "Amazing experience! The trip was well-organized and enjoyable.",
        rating: 5,
    },
    {
        id: 2,
        profilePic: user,
        name: "Mark Williams",
        review: "Great service and a memorable journey. Highly recommended!",
        rating: 4.5,
    },
    {
        id: 3,
        profilePic: user,
        name: "Sophia Brown",
        review: "A truly wonderful experience! Will book again.",
        rating: 4.8,
    },
    {
        id: 4,
        profilePic: user,
        name: "David Smith",
        review: "Loved every bit of my trip. Thanks for the great service!",
        rating: 5,
    },
];

const Reviews = () => {
    const [reviews, setReviews] = useState(reviewsData);
    const [newReview, setNewReview] = useState({
        name: "",
        review: "",
        rating: 0,
    });

    const handleInputChange = (e) => {
        setNewReview({ ...newReview, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newReview.name && newReview.review && newReview.rating > 0) {
            const newReviewObj = {
                id: reviews.length + 1,
                profilePic: "/assets/images/default-user.jpg",
                ...newReview,
            };
            setReviews([...reviews, newReviewObj]);
            setNewReview({ name: "", review: "", rating: 0 });
        }
    };

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 200,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                },
            },
        ],
    };

    return (
        <ReviewsView
            reviews={reviews}
            newReview={newReview}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            sliderSettings={sliderSettings}
        />
    );
};

export default Reviews;
