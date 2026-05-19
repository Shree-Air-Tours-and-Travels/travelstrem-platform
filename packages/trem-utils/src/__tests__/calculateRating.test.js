import { describe, it, expect } from 'vitest';
import { calculateAverageRating } from '../helpers/calculateRating.js';

describe('calculateAverageRating', () => {
  it('returns no_reviews for empty/null reviews', () => {
    expect(calculateAverageRating([])).toEqual({ avgRating: 'No reviews', ratingKey: 'no_reviews' });
    expect(calculateAverageRating(null)).toEqual({ avgRating: 'No reviews', ratingKey: 'no_reviews' });
    expect(calculateAverageRating(undefined)).toEqual({ avgRating: 'No reviews', ratingKey: 'no_reviews' });
  });

  it('returns correct average for single review', () => {
    const reviews = [{ rating: 4 }];
    const result = calculateAverageRating(reviews);
    expect(result.avgRating).toBe('4.0');
    expect(result.ratingKey).toBe('good');
  });

  it('returns correct average for multiple reviews', () => {
    const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 3 }];
    const result = calculateAverageRating(reviews);
    expect(result.avgRating).toBe('4.0');
    expect(result.ratingKey).toBe('good');
  });

  it('classifies excellent (>= 4.5)', () => {
    expect(calculateAverageRating([{ rating: 5 }, { rating: 5 }]).ratingKey).toBe('excellent');
    expect(calculateAverageRating([{ rating: 5 }, { rating: 4 }]).ratingKey).toBe('excellent');
  });

  it('classifies good (>= 3.5)', () => {
    expect(calculateAverageRating([{ rating: 4 }, { rating: 3 }]).ratingKey).toBe('good');
    expect(calculateAverageRating([{ rating: 5 }, { rating: 2 }]).ratingKey).toBe('good');
  });

  it('classifies average (>= 2.5)', () => {
    expect(calculateAverageRating([{ rating: 3 }]).ratingKey).toBe('average');
    expect(calculateAverageRating([{ rating: 3 }, { rating: 2 }]).ratingKey).toBe('average');
  });

  it('classifies poor (< 2.5)', () => {
    const reviews = [{ rating: 1 }, { rating: 2 }];
    const result = calculateAverageRating(reviews);
    expect(result.avgRating).toBe('1.5');
    expect(result.ratingKey).toBe('poor');
  });
});
