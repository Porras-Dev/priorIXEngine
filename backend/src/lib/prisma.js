if (process.env.NODE_ENV === 'production' && process.env.RESOURCES_PATH) {
  process.env.DATABASE_URL = `file:${process.env.RESOURCES_PATH}/backend/prisma/production.db`;
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

module.exports = prisma;
