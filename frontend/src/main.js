const TIER_RATES = {
  REGULAR: 150000,
  VIP: 350000,
  VVIP: 750000
};

export function formatCurrencyIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateClientEstimate(seatQty, tier = 'REGULAR') {
  const rate = TIER_RATES[String(tier).toUpperCase()];
  if (!rate || !Number.isInteger(seatQty) || seatQty < 1 || seatQty > 10) {
    throw new Error('Parameter estimasi tiket tidak valid');
  }
  const subtotal = rate * seatQty;
  return seatQty >= 4 ? Math.round(subtotal * 0.9) : subtotal;
}

export function renderReservationSummary(container, { eventCode, seatQty, tier }) {
  if (!container) return;
  const total = calculateClientEstimate(seatQty, tier);
  container.innerHTML = `
    <div class="reservation-card" data-testid="reservation-summary">
      <h2>${eventCode}</h2>
      <p>Tier: <strong>${tier.toUpperCase()}</strong> | Kursi: <strong>${seatQty}</strong></p>
      <p>Total Estimasi: <strong data-testid="total-price">${formatCurrencyIDR(total)}</strong></p>
    </div>
  `;
}

if (typeof document !== 'undefined') {
  const summaryEl = document.getElementById('summary');
  if (summaryEl) {
    renderReservationSummary(summaryEl, {
      eventCode: 'DEVOPS-CON-2026',
      seatQty: 2,
      tier: 'VIP'
    });
  }
}
