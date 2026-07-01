const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // ── Orders by quadrant (active only) ────────────────────────────────────
    const classifications = await prisma.eisenhowerClassification.findMany({
      include: { order: { select: { status: true } } }
    });

    const ordersByQuadrant = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    for (const c of classifications) {
      if (!['DONE', 'CANCELLED'].includes(c.order.status)) {
        ordersByQuadrant[c.quadrant]++;
      }
    }

    // ── Orders at risk: deadline < 48h AND still PENDING ────────────────────
    const ordersAtRisk = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        deadline: { lte: fortyEightHoursLater }
      },
      include: {
        classification: true,
        plant: { select: { name: true } }
      },
      orderBy: { deadline: 'asc' }
    });

    // ── Worker load: active task count per worker ────────────────────────────
    const workerTaskCounts = await prisma.task.groupBy({
      by: ['assignedToId'],
      where: { status: { not: 'DONE' }, assignedToId: { not: null } },
      _count: { id: true }
    });

    const workerIds = workerTaskCounts.map(w => w.assignedToId).filter(Boolean);
    const workers = await prisma.user.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, name: true, role: true }
    });

    const workerLoad = workerTaskCounts.map(w => ({
      workerId: w.assignedToId,
      name: workers.find(u => u.id === w.assignedToId)?.name || 'Unknown',
      activeTasks: w._count.id
    })).sort((a, b) => b.activeTasks - a.activeTasks);

    // ── Completed this week ──────────────────────────────────────────────────
    const completedThisWeek = await prisma.order.count({
      where: { status: 'DONE', updatedAt: { gte: weekAgo } }
    });

    // ── Total active orders ──────────────────────────────────────────────────
    const totalActive = await prisma.order.count({
      where: { status: { notIn: ['DONE', 'CANCELLED'] } }
    });

    res.json({
      ordersByQuadrant,
      ordersAtRisk,
      workerLoad,
      completedThisWeek,
      totalActive
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
