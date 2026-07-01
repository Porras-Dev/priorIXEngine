require('dotenv').config();
const app = require('./app');
const { startReclassifyJob } = require('./jobs/reclassify.job');

const PORT = parseInt(process.env.PORT || '3001', 10);

const ENDPOINTS = [
  ['POST',   '/api/auth/login                  ', 'Authenticate → JWT'],
  ['POST',   '/api/auth/refresh                ', 'Refresh JWT'],
  ['GET',    '/api/users                       ', 'List users (ADMIN)'],
  ['POST',   '/api/users                       ', 'Create user (ADMIN)'],
  ['PUT',    '/api/users/:id                   ', 'Update user (ADMIN)'],
  ['DELETE', '/api/users/:id                   ', 'Delete user (ADMIN)'],
  ['GET',    '/api/plants                      ', 'List plants'],
  ['POST',   '/api/plants                      ', 'Create plant (ADMIN)'],
  ['GET',    '/api/orders                      ', 'List orders (filters: status, quadrant, plantId, assignedTo)'],
  ['POST',   '/api/orders                      ', 'Create order + auto Eisenhower classification'],
  ['PUT',    '/api/orders/:id                  ', 'Update order'],
  ['PUT',    '/api/orders/:id/classify         ', 'Manual Eisenhower override (ADMIN/MANAGER)'],
  ['GET',    '/api/tasks                       ', 'List tasks (filters: workerId, status, orderId)'],
  ['POST',   '/api/tasks                       ', 'Create task'],
  ['PUT',    '/api/tasks/:id                   ', 'Update task (auto timestamps on status change)'],
  ['POST',   '/api/tasks/:id/photo             ', 'Attach photo URL to task'],
  ['GET',    '/api/dashboard                   ', 'Metrics: quadrants, at-risk, worker load, weekly throughput'],
  ['GET',    '/api/notifications/:userId       ', 'List notifications for user'],
  ['PUT',    '/api/notifications/:id/read      ', 'Mark notification as read'],
  ['GET',    '/api/audit-log                   ', 'Full audit trail (ADMIN)'],
  ['GET',    '/health                          ', 'Health check'],
];

app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   PriorIX Backend  —  Industrial Production API     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n  Listening on: http://localhost:${PORT}`);
  console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}\n`);
  console.log('  ── Available Endpoints ──────────────────────────────');
  for (const [method, path, desc] of ENDPOINTS) {
    console.log(`  ${method.padEnd(7)} ${path}  ${desc}`);
  }
  console.log('\n  ── Eisenhower Matrix Classification ─────────────────');
  console.log('  Q1 Urgent + Important   → Do first');
  console.log('  Q2 !Urgent + Important  → Schedule');
  console.log('  Q3 Urgent + !Important  → Delegate');
  console.log('  Q4 !Urgent + !Important → Eliminate');
  console.log('─────────────────────────────────────────────────────\n');

  startReclassifyJob();
});
