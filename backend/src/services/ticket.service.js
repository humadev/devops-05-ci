import { query } from '../infra/db.js';
import { getQuota, reserveQuota } from '../infra/redis.js';

export const TIER_PRICES = { REGULAR: 150000, VIP: 350000, VVIP: 750000 };

export function normalizeTier(tier = 'REGULAR') {
  const normalized = String(tier).trim().toUpperCase();
  if (!TIER_PRICES[normalized]) {
    throw new Error('Invalid ticket tier');
  }
  return normalized;
}

export function validateReservationInput(eventCode, attendeeEmail) {
  if (!eventCode || typeof eventCode !== 'string' || !eventCode.trim()) {
    throw new Error('Invalid event code');
  }
  if (!attendeeEmail || typeof attendeeEmail !== 'string' || !attendeeEmail.includes('@')) {
    throw new Error('Invalid attendee email');
  }
  return { cleanCode: eventCode.trim().toUpperCase(), cleanEmail: attendeeEmail.trim().toLowerCase() };
}

export function calculateReservationTotal(seatQty, tier = 'REGULAR') {
  if (!Number.isInteger(seatQty) || seatQty < 1 || seatQty > 10) {
    throw new Error('Invalid seat quantity');
  }
  const basePrice = TIER_PRICES[normalizeTier(tier)];
  const subtotal = basePrice * seatQty;
  return seatQty >= 4 ? Math.round(subtotal * 0.9) : subtotal;
}

export async function createReservation({ eventCode, attendeeEmail, seatQty, tier = 'REGULAR' }) {
  const { cleanCode, cleanEmail } = validateReservationInput(eventCode, attendeeEmail);
  const totalPrice = calculateReservationTotal(seatQty, tier);
  const cachedQuota = await getQuota(cleanCode);
  if (cachedQuota !== null && Number(cachedQuota) < seatQty) {
    throw new Error('Insufficient event quota');
  }
  const sql = `
    INSERT INTO reservations (event_code, attendee_email, seat_qty, total_price)
    VALUES ($1, $2, $3, $4)
    RETURNING id, event_code, attendee_email, seat_qty, total_price, status, created_at
  `;
  const result = await query(sql, [cleanCode, cleanEmail, seatQty, totalPrice]);
  await reserveQuota(cleanCode, seatQty);
  return result.rows[0];
}

export async function listReservations() {
  const sql = `
    SELECT id, event_code, attendee_email, seat_qty, total_price, status, created_at
    FROM reservations ORDER BY id DESC
  `;
  const result = await query(sql);
  return result.rows;
}
