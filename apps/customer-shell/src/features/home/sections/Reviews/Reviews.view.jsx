import React from "react";
import Slider from "react-slick";
import "./Reviews.styles.scss";
import ReviewCard from "../../../../shared/ui/cards/ReviewCard/ReviewCard";
import { Button, Title, SmoothScroll, Paragraph, SubTitle } from "@packages/trem-ui";

const ReviewsView = ({ reviews, newReview, handleInputChange, handleSubmit, sliderSettings }) => {
    return (
        <section className="ui-reviews">
            <SmoothScroll variant="slideUp" delay={0.1}>
                <Title className="ui-reviews__title" text="Customer Reviews" />
                <Paragraph primaryClassname="ui-reviews__subtitle" text="See what our travelers have to say about their experiences." />
            </SmoothScroll>

            <SmoothScroll variant="slideUp" delay={0.3}>
                <Slider {...sliderSettings} className="ui-reviews__slider">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </Slider>
            </SmoothScroll>

            <SmoothScroll variant="slideUp" delay={0.4}>
                <div className="ui-reviews__form">
                    <SubTitle primaryClassname="ui-reviews__form-title" text="Leave a Review" />
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
                        <Button variant="solid" color="primary" type="submit" text="Submit Review" primaryClassName="btn-primary" />
                    </form>
                </div>
            </SmoothScroll>
        </section>
    );
};

export default ReviewsView;
