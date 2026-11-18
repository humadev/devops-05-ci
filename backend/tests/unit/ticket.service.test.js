import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/infra/db.js', () => ({
  query: vi.fn()
}));

vi.mock('../../src/infra/redis.js', () => ({
  getQuota: vi.fn(),
  reserveQuota: vi.fn()
}));

import { query } from '../../src/infra/db.js';
import { getQuota, reserveQuota } from '../../src/infra/redis.js';
import {
  calculateReservationTotal,
  createReservation,
  listReservations
} from '../../src/services/ticket.service.js';

describe('ticket.service unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateReservationTotal', () => {
    it('calculates regular price without discount for under 4 seats', () => {
      expect(calculateReservationTotal(2, 'REGULAR')).toBe(300000);
      expect(calculateReservationTotal(3, 'vip')).toBe(1050000);
      expect(calculateReservationTotal(1, 'VVIP')).toBe(750000);
    });

    it('applies 10% bulk discount when seatQty >= 4', () => {
      expect(calculateReservationTotal(4, 'REGULAR')).toBe(540000);
      expect(calculateReservationTotal(5, 'VIP')).toBe(1575000);
    });

    it('throws on invalid seat quantity', () => {
      expect(() => calculateReservationTotal(0, 'REGULAR')).toThrow('Invalid seat quantity');
      expect(() => calculateReservationTotal(11, 'VIP')).toThrow('Invalid seat quantity');
      expect(() => calculateReservationTotal(1.5, 'VIP')).toThrow('Invalid seat quantity');
    });

    it('throws on unknown ticket tier', () => {
      expect(() => calculateReservationTotal(2, 'PLATINUM')).toThrow('Invalid ticket tier');
    });
  });

  describe('createReservation', () => {
    it('inserts reservation into DB and decrements Redis quota', async () => {
      getQuota.mockResolvedValue('20');
      reserveQuota.mockResolvedValue(18);
      const fakeRow = {
        id: 1,
        event_code: 'CONF-2026',
        attendee_email: 'user@example.com',
        seat_qty: 2,
        total_price: 700000,
        status: 'CONFIRMED'
      };
      query.mockResolvedValue({ rows: [fakeRow] });

      const result = await createReservation({
        eventCode: ' conf-2026 ',
        attendeeEmail: 'User@Example.com',
        seatQty: 2,
        tier: 'VIP'
      });

      expect(getQuota).toHaveBeenCalledWith('CONF-2026');
      expect(query).toHaveBeenCalledTimes(1);
      expect(reserveQuota).toHaveBeenCalledWith('CONF-2026', 2);
      expect(result).toEqual(fakeRow);
    });

    it('throws when cached Redis quota is lower than requested seats', async () => {
      getQuota.mockResolvedValue('1');

      await expect(
        createReservation({
          eventCode: 'CONF-2026',
          attendeeEmail: 'user@example.com',
          seatQty: 3,
          tier: 'REGULAR'
        })
      ).rejects.toThrow('Insufficient event quota');

      expect(query).not.toHaveBeenCalled();
    });

    it('throws on invalid event code or attendee email', async () => {
      await expect(
        createReservation({ eventCode: '  ', attendeeEmail: 'user@example.com', seatQty: 1 })
      ).rejects.toThrow('Invalid event code');

      await expect(
        createReservation({ eventCode: 'CONF-2026', attendeeEmail: 'invalid-email', seatQty: 1 })
      ).rejects.toThrow('Invalid attendee email');
    });
  });

  describe('listReservations', () => {
    it('returns all reservations ordered by newest first', async () => {
      const rows = [{ id: 2, event_code: 'CONF-2026' }];
      query.mockResolvedValue({ rows });

      const result = await listReservations();
      expect(query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });
});
