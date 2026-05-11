import React, { useState } from "react";
import Slider from "react-slick";
import "../styles/layout/review.scss";
import ReviewCard from "../components/Cards/reviewCard";
import { Title } from "@packages/trem-ui";
import user from "../assets/images/user.png"; // Default user image

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
        <section className="ui-reviews">
            <Title className="ui-reviews__title" text="Customer Reviews" />
            <p className="ui-reviews__subtitle">See what our travelers have to say about their experiences.</p>

            <Slider {...sliderSettings} className="ui-reviews__slider">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </Slider>

            <div className="ui-reviews__form">
                <h3 className="ui-reviews__form-title">Leave a Review</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={newReview.name}
                        onChange={handleInputChange}
                        className="ui-reviews__input"
                        required
                    />
                    <textarea
                        name="review"
                        placeholder="Write your review..."
                        value={newReview.review}
                        onChange={handleInputChange}
                        className="ui-reviews__textarea"
                        required
                    />
                    <input
                        type="number"
                        name="rating"
                        placeholder="Rating (1-5)"
                        min="1"
                        max="5"
                        value={newReview.rating}
                        onChange={handleInputChange}
                        className="ui-reviews__input"
                        required
                    />
                    <button type="submit" className="btn-primary">Submit Review</button>
                </form>
            </div>
        </section>
    );
};

export default Reviews;
