const prisma = require('../lib/prisma');
const { classify } = require('../services/eisenhower.service');
const { createNotification } = require('../services/notification.service');

async function reclassifyActiveOrders() {
  console.log('[ReclassifyJob] Running Eisenhower reclassification...');

  const orders = await prisma.order.findMany({
    where: { status: { notIn: ['DONE', 'CANCELLED'] } },
    include: {
      classification: true,
      tasks: { select: { assignedToId: true } }
    }
  });

  let updated = 0;

  for (const order of orders) {
    if (!order.classification || order.classification.isManualOverride) continue;

    const result = classify({
      deadline: order.deadline,
      quantity: order.quantity,
      unit: order.unit,
      complexity: order.complexity,
      clientPriority: order.clientPriority
    });

    const prevQuadrant = order.classification.quadrant;
    if (prevQuadrant === result.quadrant && order.classification.score === result.score) continue;

    await prisma.eisenhowerClassification.update({
      where: { orderId: order.id },
      data: { ...result, classifiedAt: new Date() }
    });
    updated++;

    if (prevQuadrant !== result.quadrant) {
      const assignedIds = [...new Set(
        order.tasks.map(t => t.assignedToId).filter(Boolean)
      )];

      for (const userId of assignedIds) {
        await createNotification({
          userId,
          title: `Order reclassified — ${order.reference}`,
          body: `Priority changed: ${prevQuadrant} → ${result.quadrant}`
        }).catch(err => console.error('[ReclassifyJob] Notification error:', err.message));
      }
    }
  }

  console.log(`[ReclassifyJob] Done — ${updated} order(s) updated`);
}

function startReclassifyJob() {
  // Run immediately on startup, then every hour
  reclassifyActiveOrders().catch(err =>
    console.error('[ReclassifyJob] Error on startup run:', err.message)
  );

  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    reclassifyActiveOrders().catch(err =>
      console.error('[ReclassifyJob] Error on scheduled run:', err.message)
    );
  }, INTERVAL_MS);

  console.log('[ReclassifyJob] Scheduled — runs every hour');
}

module.exports = { startReclassifyJob };
