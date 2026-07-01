require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { classify } = require('../src/services/eisenhower.service');

const prisma = new PrismaClient();

// Utility: days from now
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 PriorIX Seeder starting...');

  // ── Cleanup (order matters due to FK constraints) ──────────────────────────
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eisenhowerClassification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plant.deleteMany();
  console.log('  ✓ Previous data cleared');

  // ── Plants ────────────────────────────────────────────────────────────────
  const plantaNorte = await prisma.plant.create({
    data: { name: 'Planta Norte', location: 'Pol. Industrial Castellón Norte, Valencia' }
  });
  const plantaSur = await prisma.plant.create({
    data: { name: 'Planta Sur', location: 'Pol. Industrial Cartuja, Sevilla' }
  });
  console.log('  ✓ Plants created: Planta Norte, Planta Sur');

  // ── Password hashes ───────────────────────────────────────────────────────
  const adminHash    = await bcrypt.hash('admin123', 10);
  const managerHash  = await bcrypt.hash('manager123', 10);
  const officeHash   = await bcrypt.hash('office123', 10);
  const workerHash   = await bcrypt.hash('worker123', 10);

  // ── Users ─────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: 'Carlos Mendoza', email: 'admin@priorix.com', passwordHash: adminHash, role: 'ADMIN', plantId: plantaNorte.id }
  });

  const managerNorte = await prisma.user.create({
    data: { name: 'Ana García Ruiz', email: 'manager.norte@priorix.com', passwordHash: managerHash, role: 'MANAGER', plantId: plantaNorte.id }
  });
  const managerSur = await prisma.user.create({
    data: { name: 'Luis Rodríguez Vega', email: 'manager.sur@priorix.com', passwordHash: managerHash, role: 'MANAGER', plantId: plantaSur.id }
  });

  const office1 = await prisma.user.create({
    data: { name: 'María López Torres', email: 'office1@priorix.com', passwordHash: officeHash, role: 'OFFICE', plantId: plantaNorte.id }
  });
  const office2 = await prisma.user.create({
    data: { name: 'Pedro Sánchez Mora', email: 'office2@priorix.com', passwordHash: officeHash, role: 'OFFICE', plantId: plantaNorte.id }
  });
  const office3 = await prisma.user.create({
    data: { name: 'Carmen Torres Vidal', email: 'office3@priorix.com', passwordHash: officeHash, role: 'OFFICE', plantId: plantaSur.id }
  });

  const workerData = [
    { name: 'Javier Moreno Díaz',     email: 'worker1@priorix.com', plantId: plantaNorte.id },
    { name: 'Rosa Fernández León',    email: 'worker2@priorix.com', plantId: plantaNorte.id },
    { name: 'Miguel Herrera Santos',  email: 'worker3@priorix.com', plantId: plantaNorte.id },
    { name: 'Isabel Jiménez Castro',  email: 'worker4@priorix.com', plantId: plantaNorte.id },
    { name: 'Antonio Navarro Gil',    email: 'worker5@priorix.com', plantId: plantaNorte.id },
    { name: 'Elena Romero Peña',      email: 'worker6@priorix.com', plantId: plantaSur.id  },
    { name: 'Francisco Ortega Ruiz',  email: 'worker7@priorix.com', plantId: plantaSur.id  },
    { name: 'Laura Martínez Campos',  email: 'worker8@priorix.com', plantId: plantaSur.id  },
    { name: 'Sergio Alonso Vega',     email: 'worker9@priorix.com', plantId: plantaSur.id  },
    { name: 'Patricia Vargas Molina', email: 'worker10@priorix.com', plantId: plantaSur.id }
  ];

  const workers = [];
  for (const w of workerData) {
    workers.push(await prisma.user.create({
      data: { ...w, passwordHash: workerHash, role: 'WORKER' }
    }));
  }
  console.log('  ✓ Users created: 1 admin, 2 managers, 3 office, 10 workers');

  // ── Helper: create order + auto Eisenhower classification ─────────────────
  async function createOrder(data) {
    const order = await prisma.order.create({ data });
    const result = classify({
      deadline:       order.deadline,
      quantity:       order.quantity,
      unit:           order.unit,
      complexity:     order.complexity,
      clientPriority: order.clientPriority
    });
    await prisma.eisenhowerClassification.create({
      data: { orderId: order.id, ...result }
    });
    return order;
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  // Q1: Urgent + Important (3 orders)
  const ord01 = await createOrder({
    reference: 'ORD-2024-001', clientName: 'Volkswagen España S.A.',
    description: 'Mecanizado CNC de 500 piezas de precisión para caja de cambios automáticos DSG7.',
    quantity: 500, unit: 'piezas', complexity: 'HIGH', clientPriority: 'PREMIUM',
    deadline: daysFromNow(1), status: 'IN_PROGRESS',
    plantId: plantaNorte.id, createdById: office1.id
  });

  const ord02 = await createOrder({
    reference: 'ORD-2024-002', clientName: 'Airbus Defence and Space',
    description: 'Fabricación de soportes de motor en aleación de aluminio aeronáutico 7075-T6.',
    quantity: 250, unit: 'unidades', complexity: 'HIGH', clientPriority: 'STANDARD',
    deadline: daysFromNow(2), status: 'IN_PROGRESS',
    plantId: plantaNorte.id, createdById: office1.id
  });

  const ord03 = await createOrder({
    reference: 'ORD-2024-003', clientName: 'Repsol Industrial S.L.',
    description: 'Mecanizado de 350 bridas y racores para tuberías de alta presión (PN160).',
    quantity: 350, unit: 'piezas', complexity: 'HIGH', clientPriority: 'STANDARD',
    deadline: daysFromNow(5), status: 'IN_PROGRESS',
    plantId: plantaNorte.id, createdById: office2.id
  });

  // Q2: Not Urgent + Important (3 orders)
  const ord04 = await createOrder({
    reference: 'ORD-2024-004', clientName: 'ArcelorMittal España S.A.',
    description: 'Fabricación de 350 bastidores estructurales para vagones de mercancías FFCC.',
    quantity: 350, unit: 'unidades', complexity: 'MEDIUM', clientPriority: 'STANDARD',
    deadline: daysFromNow(20), status: 'PENDING',
    plantId: plantaSur.id, createdById: office3.id
  });

  const ord05 = await createOrder({
    reference: 'ORD-2024-005', clientName: 'Siemens Iberia S.A.',
    description: 'Torneado y fresado de 80 ejes de transmisión para motores industriales Serie 1LA.',
    quantity: 80, unit: 'ejes', complexity: 'HIGH', clientPriority: 'PREMIUM',
    deadline: daysFromNow(12), status: 'PENDING',
    plantId: plantaNorte.id, createdById: office1.id
  });

  const ord06 = await createOrder({
    reference: 'ORD-2024-006', clientName: 'Navantia S.A.',
    description: 'Montaje y calibración de 100 válvulas de seguridad industriales para fragatas.',
    quantity: 100, unit: 'válvulas', complexity: 'LOW', clientPriority: 'PREMIUM',
    deadline: daysFromNow(25), status: 'QUALITY_CHECK',
    plantId: plantaSur.id, createdById: office3.id
  });

  // Q3: Urgent + Not Important (3 orders)
  const ord07 = await createOrder({
    reference: 'ORD-2024-007', clientName: 'Ferrovial Servicios S.A.',
    description: 'Corte y conformado de 150 chapas galvanizadas para estructura de cerramiento.',
    quantity: 150, unit: 'chapas', complexity: 'MEDIUM', clientPriority: 'STANDARD',
    deadline: daysFromNow(4), status: 'PENDING',
    plantId: plantaNorte.id, createdById: office2.id
  });

  const ord08 = await createOrder({
    reference: 'ORD-2024-008', clientName: 'Acciona Energía S.A.',
    description: 'Suministro urgente de 30 piezas de repuesto para turbinas eólicas paradas.',
    quantity: 30, unit: 'piezas', complexity: 'LOW', clientPriority: 'STANDARD',
    deadline: daysFromNow(1), status: 'PENDING',
    plantId: plantaSur.id, createdById: office3.id
  });

  const ord09 = await createOrder({
    reference: 'ORD-2024-009', clientName: 'Seat MARTORELL S.A.',
    description: 'Soldadura por puntos de 120 conjuntos de carrocería para producción serie.',
    quantity: 120, unit: 'conjuntos', complexity: 'MEDIUM', clientPriority: 'STANDARD',
    deadline: daysFromNow(6), status: 'PENDING',
    plantId: plantaSur.id, createdById: office3.id
  });

  // Q4: Not Urgent + Not Important (6 orders)
  const ord10 = await createOrder({
    reference: 'ORD-2024-010', clientName: 'Electrolux Industrial España',
    description: 'Fresado de 50 moldes para inyección de plástico técnico PA66-GF30.',
    quantity: 50, unit: 'moldes', complexity: 'LOW', clientPriority: 'STANDARD',
    deadline: daysFromNow(20), status: 'IN_PROGRESS',
    plantId: plantaNorte.id, createdById: office1.id
  });

  const ord11 = await createOrder({
    reference: 'ORD-2024-011', clientName: 'Industrias Químicas Hernán S.L.',
    description: 'Fabricación de 30 depósitos de almacenamiento en acero inoxidable AISI 316L.',
    quantity: 30, unit: 'depósitos', complexity: 'LOW', clientPriority: 'STANDARD',
    deadline: daysFromNow(45), status: 'PENDING',
    plantId: plantaSur.id, createdById: office3.id
  });

  const ord12 = await createOrder({
    reference: 'ORD-2024-012', clientName: 'Construcciones Metálicas Cano',
    description: 'Tratamiento superficial y galvanizado de 80 componentes estructurales.',
    quantity: 80, unit: 'piezas', complexity: 'MEDIUM', clientPriority: 'STANDARD',
    deadline: daysFromNow(30), status: 'DONE',
    plantId: plantaNorte.id, createdById: office2.id
  });

  const ord13 = await createOrder({
    reference: 'ORD-2024-013', clientName: 'Talleres Martínez e Hijos S.L.',
    description: 'Fabricación de 100 pernos de anclaje M24 de alta resistencia grado 10.9.',
    quantity: 100, unit: 'pernos', complexity: 'LOW', clientPriority: 'STANDARD',
    deadline: daysFromNow(60), status: 'DONE',
    plantId: plantaSur.id, createdById: office3.id
  });

  const ord14 = await createOrder({
    reference: 'ORD-2024-014', clientName: 'Grupo Vía Infraestructuras',
    description: 'Montaje de 150 subconjuntos hidráulicos para maquinaria de obra civil.',
    quantity: 150, unit: 'subconjuntos', complexity: 'LOW', clientPriority: 'STANDARD',
    deadline: daysFromNow(15), status: 'PENDING',
    plantId: plantaNorte.id, createdById: office1.id
  });

  const ord15 = await createOrder({
    reference: 'ORD-2024-015', clientName: 'Alstom Ferroviario S.A.',
    description: 'Mecanizado de 90 bloques de motor diésel para locomotoras de maniobras.',
    quantity: 90, unit: 'bloques', complexity: 'MEDIUM', clientPriority: 'STANDARD',
    deadline: daysFromNow(10), status: 'PENDING',
    plantId: plantaSur.id, createdById: office3.id
  });

  console.log('  ✓ 15 orders created with Eisenhower classifications');

  // ── Tasks (2–3 per order) ─────────────────────────────────────────────────
  const taskDefs = [
    // ORD-001 (IN_PROGRESS)
    { orderId: ord01.id, assignedToId: workers[0].id, title: 'Programación CNC — pieza A1', status: 'DONE',       estimatedMinutes: 180, actualMinutes: 165, startedAt: daysFromNow(-2), completedAt: daysFromNow(-1) },
    { orderId: ord01.id, assignedToId: workers[1].id, title: 'Mecanizado serie — lote 1/5',  status: 'IN_PROGRESS', estimatedMinutes: 240, startedAt: daysFromNow(-1) },
    { orderId: ord01.id, assignedToId: workers[2].id, title: 'Control dimensional CMM',       status: 'TODO',        estimatedMinutes: 120 },
    // ORD-002 (IN_PROGRESS)
    { orderId: ord02.id, assignedToId: workers[0].id, title: 'Preparación utillaje aluminio 7075', status: 'DONE', estimatedMinutes: 90, actualMinutes: 95, startedAt: daysFromNow(-3), completedAt: daysFromNow(-2) },
    { orderId: ord02.id, assignedToId: workers[3].id, title: 'Mecanizado soportes — lote 1',  status: 'IN_PROGRESS', estimatedMinutes: 300, startedAt: daysFromNow(-1) },
    // ORD-003 (IN_PROGRESS)
    { orderId: ord03.id, assignedToId: workers[1].id, title: 'Torneado bridas DN50–DN200',    status: 'IN_PROGRESS', estimatedMinutes: 360, startedAt: daysFromNow(-2) },
    { orderId: ord03.id, assignedToId: workers[4].id, title: 'Roscado racores NPT y BSP',    status: 'TODO',        estimatedMinutes: 200 },
    // ORD-004
    { orderId: ord04.id, assignedToId: workers[5].id, title: 'Revisión planos estructura',   status: 'DONE', estimatedMinutes: 60, actualMinutes: 55, startedAt: daysFromNow(-5), completedAt: daysFromNow(-4) },
    { orderId: ord04.id, assignedToId: workers[6].id, title: 'Corte y preparación perfiles', status: 'TODO', estimatedMinutes: 480 },
    // ORD-005
    { orderId: ord05.id, assignedToId: workers[0].id, title: 'Programación torno CNC — eje MN7', status: 'TODO', estimatedMinutes: 120 },
    { orderId: ord05.id, assignedToId: workers[1].id, title: 'Mecanizado ejes lote 1/2',     status: 'TODO', estimatedMinutes: 420 },
    // ORD-006 (QUALITY_CHECK)
    { orderId: ord06.id, assignedToId: workers[7].id, title: 'Pruebas de estanqueidad',      status: 'IN_PROGRESS', estimatedMinutes: 180, startedAt: daysFromNow(-1) },
    { orderId: ord06.id, assignedToId: workers[8].id, title: 'Documentación certificación',  status: 'TODO', estimatedMinutes: 90 },
    // ORD-007
    { orderId: ord07.id, assignedToId: workers[2].id, title: 'Corte por plasma chapas 2mm',  status: 'TODO', estimatedMinutes: 240 },
    // ORD-008
    { orderId: ord08.id, assignedToId: workers[9].id, title: 'Fabricación repuestos urgentes', status: 'TODO', estimatedMinutes: 150 },
    // ORD-009
    { orderId: ord09.id, assignedToId: workers[6].id, title: 'Soldadura por puntos — lotes 1–4', status: 'TODO', estimatedMinutes: 320 },
    { orderId: ord09.id, assignedToId: workers[7].id, title: 'Inspección visual soldaduras',  status: 'TODO', estimatedMinutes: 60 },
    // ORD-010 (IN_PROGRESS)
    { orderId: ord10.id, assignedToId: workers[3].id, title: 'Diseño CAM moldes PA66',        status: 'DONE', estimatedMinutes: 180, actualMinutes: 195, startedAt: daysFromNow(-3), completedAt: daysFromNow(-2) },
    { orderId: ord10.id, assignedToId: workers[4].id, title: 'Fresado cavidades — lote 1',    status: 'IN_PROGRESS', estimatedMinutes: 360, startedAt: daysFromNow(-1) },
    // ORD-011
    { orderId: ord11.id, assignedToId: workers[8].id, title: 'Calderería depósitos 500L',     status: 'TODO', estimatedMinutes: 600 },
    // ORD-012 (DONE)
    { orderId: ord12.id, assignedToId: workers[9].id, title: 'Decapado y fosfatado',          status: 'DONE', estimatedMinutes: 120, actualMinutes: 115, startedAt: daysFromNow(-10), completedAt: daysFromNow(-9) },
    { orderId: ord12.id, assignedToId: workers[9].id, title: 'Galvanizado en caliente',       status: 'DONE', estimatedMinutes: 240, actualMinutes: 250, startedAt: daysFromNow(-9), completedAt: daysFromNow(-8) },
    // ORD-013 (DONE)
    { orderId: ord13.id, assignedToId: workers[5].id, title: 'Torneado pernos M24 Gr.10.9',  status: 'DONE', estimatedMinutes: 180, actualMinutes: 170, startedAt: daysFromNow(-15), completedAt: daysFromNow(-14) },
    // ORD-014
    { orderId: ord14.id, assignedToId: workers[2].id, title: 'Montaje cilindros hidráulicos', status: 'TODO', estimatedMinutes: 300 },
    { orderId: ord14.id, assignedToId: workers[3].id, title: 'Test de presión hidráulica',    status: 'TODO', estimatedMinutes: 90 },
    // ORD-015
    { orderId: ord15.id, assignedToId: workers[6].id, title: 'Mecanizado bloques fundición',  status: 'TODO', estimatedMinutes: 480 },
    { orderId: ord15.id, assignedToId: workers[7].id, title: 'Rectificado superficies planas', status: 'TODO', estimatedMinutes: 120 }
  ];

  for (const t of taskDefs) {
    await prisma.task.create({ data: t });
  }
  console.log(`  ✓ ${taskDefs.length} tasks created`);

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: managerNorte.id, title: 'Pedido crítico — ORD-2024-001', body: 'Volkswagen: plazo en menos de 24 h. Revisad avance.', read: false },
      { userId: managerNorte.id, title: 'Pedido crítico — ORD-2024-002', body: 'Airbus: plazo en 2 días. Estado actual: En progreso.', read: true  },
      { userId: workers[0].id,   title: 'Nueva tarea asignada',           body: 'Tienes una nueva tarea en ORD-2024-001 (Volkswagen).', read: false },
      { userId: workers[1].id,   title: 'Tarea completada — revisión',    body: 'La tarea de programación CNC ha sido validada.', read: false },
      { userId: managerSur.id,   title: 'Pedido en control de calidad',   body: 'ORD-2024-006 (Navantia) está pendiente de aprobación QC.', read: false }
    ]
  });
  console.log('  ✓ Sample notifications created');

  // ── Audit log entries ─────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'USER_CREATED',  entityType: 'User', entityId: managerNorte.id,  oldValue: null, newValue: JSON.stringify({ role: 'MANAGER', email: managerNorte.email }) },
      { userId: admin.id, action: 'USER_CREATED',  entityType: 'User', entityId: managerSur.id,    oldValue: null, newValue: JSON.stringify({ role: 'MANAGER', email: managerSur.email   }) },
      { userId: managerNorte.id, action: 'ORDER_STATUS_CHANGE', entityType: 'Order', entityId: ord01.id, oldValue: 'PENDING', newValue: 'IN_PROGRESS' },
      { userId: managerNorte.id, action: 'ORDER_STATUS_CHANGE', entityType: 'Order', entityId: ord02.id, oldValue: 'PENDING', newValue: 'IN_PROGRESS' }
    ]
  });
  console.log('  ✓ Audit log entries created');

  // ── Summary ───────────────────────────────────────────────────────────────
  const classifications = await prisma.eisenhowerClassification.findMany();
  const byQuadrant = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const c of classifications) byQuadrant[c.quadrant]++;

  console.log('\n  ─────────────────────────────────────────────');
  console.log(`  Eisenhower distribution of 15 seeded orders:`);
  console.log(`    Q1 (Urgent + Important):     ${byQuadrant.Q1} orders`);
  console.log(`    Q2 (!Urgent + Important):    ${byQuadrant.Q2} orders`);
  console.log(`    Q3 (Urgent + !Important):    ${byQuadrant.Q3} orders`);
  console.log(`    Q4 (!Urgent + !Important):   ${byQuadrant.Q4} orders`);
  console.log('  ─────────────────────────────────────────────');
  console.log('\n  Default credentials:');
  console.log('    admin@priorix.com         → admin123');
  console.log('    manager.norte@priorix.com → manager123');
  console.log('    manager.sur@priorix.com   → manager123');
  console.log('    worker1@priorix.com       → worker123');
  console.log('\n🌱 Seed completed successfully!\n');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
