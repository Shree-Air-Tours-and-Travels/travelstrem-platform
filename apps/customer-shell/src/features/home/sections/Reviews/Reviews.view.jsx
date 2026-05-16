import React from "react";
import Slider from "react-slick";
import "./Reviews.styles.scss";
import ReviewCard from "../../../../shared/ui/cards/ReviewCard/ReviewCard";
import { Title } from "@packages/trem-ui";

const ReviewsView = ({ reviews, newReview, handleInputChange, handleSubmit, sliderSettings }) => {
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

export default ReviewsView;
