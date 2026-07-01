const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { classify } = require('../services/eisenhower.service');

const router = express.Router();

router.use(authenticate);

const ORDER_INCLUDE = {
  classification: true,
  plant: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  tasks: {
    include: { assignedTo: { select: { id: true, name: true } } }
  }
};

// GET /api/orders
router.get('/', async (req, res, next) => {
  try {
    const { status, quadrant, plantId, assignedTo } = req.query;

    const where = {};
    if (status) where.status = status;
    if (plantId) where.plantId = plantId;

    let orders = await prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    // Post-query filters for nested fields
    if (quadrant) {
      orders = orders.filter(o => o.classification?.quadrant === quadrant);
    }
    if (assignedTo) {
      orders = orders.filter(o => o.tasks.some(t => t.assignedToId === assignedTo));
    }

    // Sort: Q1 → Q2 → Q3 → Q4, then by score desc within each quadrant
    const qOrder = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };
    orders.sort((a, b) => {
      const qa = a.classification?.quadrant;
      const qb = b.classification?.quadrant;
      const diff = (qOrder[qa] ?? 4) - (qOrder[qb] ?? 4);
      if (diff !== 0) return diff;
      return (b.classification?.score ?? 0) - (a.classification?.score ?? 0);
    });

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders
router.post('/', async (req, res, next) => {
  try {
    const {
      reference, clientName, description, quantity, unit,
      complexity, clientPriority, deadline, plantId
    } = req.body;

    if (!reference || !clientName || !description || !quantity || !unit || !deadline || !plantId) {
      return res.status(400).json({ error: 'reference, clientName, description, quantity, unit, deadline and plantId are required' });
    }

    const order = await prisma.order.create({
      data: {
        reference,
        clientName,
        description,
        quantity: parseInt(quantity),
        unit,
        complexity: complexity || 'MEDIUM',
        clientPriority: clientPriority || 'STANDARD',
        deadline: new Date(deadline),
        plantId,
        createdById: req.user.id
      }
    });

    // Auto-classify
    const result = classify({
      deadline: order.deadline,
      quantity: order.quantity,
      unit: order.unit,
      complexity: order.complexity,
      clientPriority: order.clientPriority
    });

    const classification = await prisma.eisenhowerClassification.create({
      data: { orderId: order.id, ...result }
    });

    res.status(201).json({ ...order, classification });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Order reference already exists' });
    next(err);
  }
});

// PUT /api/orders/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { clientName, description, quantity, unit, complexity, clientPriority, deadline, status } = req.body;
    const data = {};
    if (clientName !== undefined) data.clientName = clientName;
    if (description !== undefined) data.description = description;
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (unit !== undefined) data.unit = unit;
    if (complexity !== undefined) data.complexity = complexity;
    if (clientPriority !== undefined) data.clientPriority = clientPriority;
    if (deadline !== undefined) data.deadline = new Date(deadline);
    if (status !== undefined) data.status = status;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: ORDER_INCLUDE
    });

    // Reclassify if classification-relevant fields changed (skip manual overrides)
    const needsReclassify = deadline !== undefined || quantity !== undefined || complexity !== undefined || clientPriority !== undefined;
    if (needsReclassify && order.classification && !order.classification.isManualOverride) {
      const result = classify({
        deadline: order.deadline,
        quantity: order.quantity,
        unit: order.unit,
        complexity: order.complexity,
        clientPriority: order.clientPriority
      });
      await prisma.eisenhowerClassification.update({
        where: { orderId: order.id },
        data: { ...result, classifiedAt: new Date() }
      });
      order.classification = { ...order.classification, ...result };
    }

    res.json(order);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found' });
    next(err);
  }
});

// PUT /api/orders/:id/classify — manual Eisenhower override
router.put('/:id/classify', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { urgency, importance, quadrant, score } = req.body;
    if (urgency === undefined || importance === undefined || !quadrant || score === undefined) {
      return res.status(400).json({ error: 'urgency, importance, quadrant and score are required' });
    }

    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { classification: true }
    });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const oldValue = existing.classification ? JSON.stringify(existing.classification) : null;

    const classification = await prisma.eisenhowerClassification.upsert({
      where: { orderId: req.params.id },
      update: {
        urgency, importance, quadrant, score,
        classifiedAt: new Date(),
        overriddenById: req.user.id,
        overriddenAt: new Date(),
        isManualOverride: true
      },
      create: {
        orderId: req.params.id,
        urgency, importance, quadrant, score,
        overriddenById: req.user.id,
        overriddenAt: new Date(),
        isManualOverride: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'MANUAL_CLASSIFY_OVERRIDE',
        entityType: 'EisenhowerClassification',
        entityId: classification.id,
        oldValue,
        newValue: JSON.stringify(classification)
      }
    });

    res.json(classification);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
