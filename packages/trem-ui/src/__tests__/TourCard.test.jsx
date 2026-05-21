import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TourCard from '../components/TourCard/TourCard.jsx';

const baseTour = {
  _id: 'tour-1',
  title: 'Himalayan Adventure',
  photo: '/photos/himalaya.jpg',
  desc: 'An amazing trek through the Himalayas',
  avgRating: 4.5,
  maxGroupSize: 12,
  period: { days: 7, nights: 6 },
  tags: ['trekking'],
  address: { city: 'Manali', country: 'India' },
  priceInfo: { min: 15000, max: 25000, currency: 'INR' },
  reviews: [{ rating: 5 }],
};

describe('TourCard', () => {
  it('renders tour title and description', () => {
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} />
      </MemoryRouter>
    );
    expect(screen.getByText('Himalayan Adventure')).toBeInTheDocument();
    expect(screen.getByText(/An amazing trek/)).toBeInTheDocument();
  });

  it('renders as a link when path is provided', () => {
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} path="/tours/tour-1" />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('renders as article when no path', () => {
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} />
      </MemoryRouter>
    );
    const articles = screen.getAllByRole('button');
    expect(articles.length).toBeGreaterThanOrEqual(1);
    expect(articles[0].className).toContain('tour-card');
  });

  it('shows featured badge when featured', () => {
    render(
      <MemoryRouter>
        <TourCard tour={{ ...baseTour, featured: true }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('shows admin actions when isAdmin', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} isAdmin onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows heart when favorited and onFavorite provided', () => {
    const onFavorite = vi.fn();
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} favorited={false} onFavorite={onFavorite} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
  });

  it('shows location text', () => {
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Manali, India/)).toBeInTheDocument();
  });

  it('displays price', () => {
    render(
      <MemoryRouter>
        <TourCard tour={baseTour} />
      </MemoryRouter>
    );
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('₹15,000 - ₹25,000')).toBeInTheDocument();
  });
});
