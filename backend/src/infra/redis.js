import Redis from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis({ host: env.REDIS_HOST, port: env.REDIS_PORT, lazyConnect: true });
export const getQuota = (eventCode) => redis.get(`quota:${eventCode}`);

export async function reserveQuota(eventCode, seatQty) {
  const current = await redis.get(`quota:${eventCode}`);
  return current === null ? null : redis.decrby(`quota:${eventCode}`, seatQty);
}
