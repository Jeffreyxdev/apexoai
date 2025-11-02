import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis error:', err));
client.connect();
export const connectRedis = async () => {
  try {
    if (!client.isOpen) await client.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
};
export const cacheService = {
  async get(key) {
    const data = await client.get(key);
    return data;
  },
  async set(key, value, ttl = 3600) {
    await client.setEx(key, ttl, value);
  },
  async del(key) {
    await client.del(key);
  },
};
