import { describe, it, expect } from 'vitest';
import {
  formatCurrencyIDR,
  calculateClientEstimate,
  renderReservationSummary
} from '../src/main.js';

describe('Ticket Pulse Frontend UI helpers', () => {
  it('formats IDR currency properly', () => {
    const formatted = formatCurrencyIDR(350000).replace(/\u00a0/g, ' ');
    expect(formatted).toContain('Rp');
    expect(formatted).toContain('350.000');
  });

  it('calculates client estimate with bulk discount at 4+ seats', () => {
    expect(calculateClientEstimate(2, 'VIP')).toBe(700000);
    expect(calculateClientEstimate(4, 'REGULAR')).toBe(540000);
    expect(() => calculateClientEstimate(0, 'REGULAR')).toThrow(
      'Parameter estimasi tiket tidak valid'
    );
  });

  it('renders reservation summary card into DOM container', () => {
    const container = document.createElement('div');
    renderReservationSummary(container, {
      eventCode: 'CLOUD-SUMMIT',
      seatQty: 4,
      tier: 'REGULAR'
    });

    const card = container.querySelector('[data-testid="reservation-summary"]');
    const price = container.querySelector('[data-testid="total-price"]');
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('CLOUD-SUMMIT');
    expect(price.textContent).toContain('540.000');
  });
});
