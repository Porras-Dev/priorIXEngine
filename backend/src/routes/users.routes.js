const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  plantId: true, fcmToken: true, createdAt: true, updatedAt: true,
  plant: { select: { id: true, name: true } }
};

router.use(authenticate, authorize('ADMIN'));

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const { role, plantId } = req.query;
    const where = {};
    if (role) where.role = role;
    if (plantId) where.plantId = plantId;

    const users = await prisma.user.findMany({ where, select: USER_SELECT, orderBy: { createdAt: 'desc' } });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role, plantId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role, plantId: plantId || null },
      select: USER_SELECT
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, password, role, plantId, fcmToken } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (password !== undefined) data.passwordHash = await bcrypt.hash(password, 10);
    if (role !== undefined) data.role = role;
    if (plantId !== undefined) data.plantId = plantId || null;
    if (fcmToken !== undefined) data.fcmToken = fcmToken || null;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: USER_SELECT
    });
    res.json(user);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    next(err);
  }
});

module.exports = router;
