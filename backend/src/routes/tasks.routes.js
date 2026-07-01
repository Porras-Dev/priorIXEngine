const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  order: { select: { id: true, reference: true, clientName: true } }
};

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { workerId, status, orderId } = req.query;
    const where = {};
    if (workerId) where.assignedToId = workerId;
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    const tasks = await prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const { orderId, assignedToId, title, description, estimatedMinutes } = req.body;
    if (!orderId || !title) {
      return res.status(400).json({ error: 'orderId and title are required' });
    }

    const task = await prisma.task.create({
      data: {
        orderId,
        assignedToId: assignedToId || null,
        title,
        description: description || null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null
      },
      include: TASK_INCLUDE
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, estimatedMinutes, actualMinutes, status, assignedToId } = req.body;
    const data = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (estimatedMinutes !== undefined) data.estimatedMinutes = estimatedMinutes !== null ? parseInt(estimatedMinutes) : null;
    if (actualMinutes !== undefined) data.actualMinutes = actualMinutes !== null ? parseInt(actualMinutes) : null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

    if (status !== undefined) {
      data.status = status;
      if (status === 'IN_PROGRESS') {
        data.startedAt = new Date();
      } else if (status === 'DONE') {
        // Fetch current task to check if startedAt already set
        const existing = await prisma.task.findUnique({ where: { id: req.params.id }, select: { startedAt: true } });
        if (!existing?.startedAt) data.startedAt = new Date();
        data.completedAt = new Date();
      }
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: TASK_INCLUDE
    });
    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Task not found' });
    next(err);
  }
});

// POST /api/tasks/:id/photo
router.post('/:id/photo', async (req, res, next) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'photoUrl is required' });

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { photoUrl },
      include: TASK_INCLUDE
    });
    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Task not found' });
    next(err);
  }
});

module.exports = router;
