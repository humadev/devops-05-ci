export const env = {
  PORT: Number(process.env.PORT || 3000),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_USER: process.env.DB_USER || 'devops',
  DB_PASSWORD: process.env.DB_PASSWORD || 'devops_secret',
  DB_NAME: process.env.DB_NAME || 'tickets_ci',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379)
};
