import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputField from '../components/InputField/InputField.jsx';

describe('InputField', () => {
  it('renders an internal label with required marker', () => {
    render(<InputField label="First name" required />);
    const label = screen.getByText('First name');
    const root = label.closest('.trem-input');
    expect(root).toHaveClass('trem-input--labelled');
    expect(label.classList.contains('trem-input__label')).toBe(true);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render a label when label is omitted', () => {
    const { container } = render(<InputField placeholder="Enter name" />);
    expect(container.querySelector('.trem-input__label')).not.toBeInTheDocument();
    expect(container.querySelector('.trem-input')).not.toHaveClass('trem-input--labelled');
  });

  it('fires onChange for text input', () => {
    const handleChange = vi.fn();
    render(<InputField label="Name" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ada' } });
    expect(handleChange).toHaveBeenCalledWith('Ada');
  });

  it('keeps label and country code row together for tel variant', () => {
    render(<InputField label="Phone number" variant="tel" value="98765" onChange={() => {}} />);
    const root = screen.getByText('Phone number').closest('.trem-input');
    expect(root).toHaveClass('trem-input--tel');
    expect(root.querySelector('.trem-input__row .trem-input__cc-trigger')).toBeInTheDocument();
    expect(root.querySelector('.trem-input__row .trem-input__field')).toHaveValue('98765');
  });

  it('accepts digits in a phone field', () => {
    const handleChange = vi.fn();
    render(<InputField label="Phone number" variant="tel" value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '960225763' } });
    expect(handleChange).toHaveBeenCalledWith('960225763');
  });

  it('keeps the country-code trigger compact while widening its menu', () => {
    render(<InputField label="Phone number" variant="tel" value="" onChange={() => {}} />);
    const trigger = screen.getByText('+91').closest('.trem-dropdown');
    expect(trigger.style.width).toBe('');
  });
});
