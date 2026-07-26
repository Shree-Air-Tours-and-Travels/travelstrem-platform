import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FavoritesProvider, useFavoritesContext } from '../context/FavoritesContext.jsx';

function TestConsumer() {
  const { isFavorited, toggleFavorite } = useFavoritesContext();
  return (
    <div>
      <span data-testid="functions">
        {typeof isFavorited},{typeof toggleFavorite}
      </span>
    </div>
  );
}

describe('FavoritesContext', () => {
  it('provides context to children', () => {
    render(
      <FavoritesProvider>
        <TestConsumer />
      </FavoritesProvider>
    );
    expect(screen.getByTestId('functions')).toHaveTextContent('function,function');
  });

  it('returns defaults when useFavoritesContext is used outside provider', () => {
    render(<TestConsumer />);
    expect(screen.getByTestId('functions')).toHaveTextContent('function,function');
  });
});
