import { RateLimiterMemory } from 'rate-limiter-flexible';

const opts = {
  points: 5, // 5 requests
  duration: 60, // per 60 seconds
};

const rateLimiter = new RateLimiterMemory(opts);

export default async function rateLimit(res, points, key) {
  try {
    await rateLimiter.consume(key, points);
    return true;
  } catch (rejRes) {
    res.setHeader('Retry-After', Math.ceil(rejRes.msBeforeNext / 1000));
    return false;
  }
}