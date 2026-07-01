const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

// GET /api/audit-log
router.get('/', async (req, res, next) => {
  try {
    const { entityType, userId, limit = '100', offset = '0' } = req.query;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit), 500),
      skip: parseInt(offset)
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
