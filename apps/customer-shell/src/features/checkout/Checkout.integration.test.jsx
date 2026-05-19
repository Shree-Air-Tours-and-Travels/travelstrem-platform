import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import CheckoutPageView from './Checkout.view';

afterEach(() => {
  cleanup();
});

const mockBooking = {
  _id: 'booking-123',
  bookingRef: 'TREM-001',
  startDate: '2024-12-01',
  endDate: '2024-12-10',
  guestsCount: 2,
  status: 'CONFIRMED',
  travelers: [
    { _id: 't1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', phone: '+1234567890' },
    { _id: 't2', firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', phone: '' },
  ],
  priceSnapshot: {
    perPerson: 25000,
    total: 50000,
    currency: 'INR',
  },
};

const mockTour = {
  title: 'Himalayan Trek',
  city: { from: 'Delhi', to: 'Manali' },
  cancellationPolicy: 'Free cancellation up to 7 days before departure.',
};

function renderView(props = {}) {
  const navigate = jest.fn();
  return render(
    <CheckoutPageView
      booking={null}
      tour={null}
      loading={false}
      error=""
      processing={false}
      handlePay={jest.fn()}
      handleGetQuote={jest.fn()}
      navigate={navigate}
      {...props}
    />
  );
}

describe('CheckoutPage - Integration', () => {
  it('shows loading state', () => {
    renderView({ loading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Error:')).not.toBeInTheDocument();
  });

  it('shows error state', () => {
    renderView({ error: 'Failed to load booking' });
    expect(screen.getByText('Error: Failed to load booking')).toBeInTheDocument();
  });

  it('shows not found when no booking', () => {
    renderView();
    expect(screen.getByText('Booking not found.')).toBeInTheDocument();
  });

  it('renders full checkout page with booking and tour data', () => {
    renderView({
      booking: mockBooking,
      tour: mockTour,
    });

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('TREM-001')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('shows Pay button for PAYMENT_PENDING status', () => {
    renderView({
      booking: { ...mockBooking, status: 'PAYMENT_PENDING' },
      tour: mockTour,
    });

    expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
  });

  it('shows Get quote button for non-payment statuses', () => {
    renderView({
      booking: { ...mockBooking, status: 'QUOTE_SENT' },
      tour: mockTour,
    });

    const quoteBtn = screen.getByRole('button', { name: /get quote/i });
    expect(quoteBtn).toBeInTheDocument();
  });

  it('shows no travelers message when travelers array is empty', () => {
    renderView({
      booking: { ...mockBooking, travelers: [] },
      tour: mockTour,
    });

    expect(screen.getByText('No traveler details provided yet.')).toBeInTheDocument();
  });

  it('renders summary sidebar with price', () => {
    renderView({
      booking: mockBooking,
      tour: mockTour,
    });

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Cancellation policy')).toBeInTheDocument();
    expect(screen.getByText(/need help/i)).toBeInTheDocument();
  });

  it('shows Back navigation button', () => {
    renderView({
      booking: mockBooking,
      tour: mockTour,
    });

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});
