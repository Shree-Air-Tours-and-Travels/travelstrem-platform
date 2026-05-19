import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BookingSummaryCard from '../components/BookingSummaryCard/BookingSummaryCard.jsx';

describe('BookingSummaryCard', () => {
  const baseTour = {
    title: 'Himalayan Trek',
    city: { from: 'Delhi', to: 'Manali' },
  };

  it('renders with minimal props', () => {
    render(<BookingSummaryCard tour={baseTour} />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Himalayan Trek')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders price from priceSnapshot', () => {
    render(
      <BookingSummaryCard
        tour={baseTour}
        priceSnapshot={{ perPerson: 25000, currency: 'INR' }}
      />
    );
    expect(screen.getByText('Per person')).toBeInTheDocument();
    expect(screen.getByText('Estimate Cost')).toBeInTheDocument();
  });

  it('renders with dates and guests', () => {
    render(
      <BookingSummaryCard
        tour={baseTour}
        startDate="2024-12-01"
        endDate="2024-12-10"
        guests={2}
      />
    );
    expect(screen.getByText(/2024-12-01.*2024-12-10/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows city route when available', () => {
    render(<BookingSummaryCard tour={baseTour} />);
    expect(screen.getByText(/Delhi.*Manali/)).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('calculates total from perPerson * guests', () => {
    render(
      <BookingSummaryCard
        tour={baseTour}
        guests={3}
        priceSnapshot={{ perPerson: 10000, currency: 'INR' }}
      />
    );
    expect(screen.getByText(/₹30,000/)).toBeInTheDocument();
  });
});
