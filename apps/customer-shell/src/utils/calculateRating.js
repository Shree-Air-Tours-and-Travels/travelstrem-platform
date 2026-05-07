export const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) {
      return { avgRating: "No reviews", ratingKey: "no_reviews" }; // No reviews
    }
  
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);
  
    // Determine rating key based on the average rating
    let ratingKey = "average"; // Default
  
    if (avgRating >= 4.5) {
      ratingKey = "excellent";
    } else if (avgRating >= 3.5) {
      ratingKey = "good";
    } else if (avgRating >= 2.5) {
      ratingKey = "average";
    } else {
      ratingKey = "poor";
    }
  
    return { avgRating, ratingKey };
  };
  