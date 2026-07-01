const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/plants
router.get('/', async (req, res, next) => {
  try {
    const plants = await prisma.plant.findMany({
      include: { _count: { select: { users: true, orders: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(plants);
  } catch (err) {
    next(err);
  }
});

// POST /api/plants
router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, location } = req.body;
    if (!name || !location) {
      return res.status(400).json({ error: 'name and location are required' });
    }
    const plant = await prisma.plant.create({ data: { name, location } });
    res.status(201).json(plant);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
