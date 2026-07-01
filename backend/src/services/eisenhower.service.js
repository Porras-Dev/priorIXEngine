/**
 * Eisenhower Matrix classification engine.
 *
 * Urgency rules:
 *   < 3 days  → always urgent
 *   3–7 days  → urgent if complexity === HIGH or quantity > 100
 *   > 7 days  → urgent only if complexity === HIGH AND quantity > 500
 *
 * Importance rules:
 *   clientPriority === PREMIUM  → always important
 *   quantity > 200              → important
 *   complexity === HIGH         → important
 *
 * Quadrants:
 *   Q1 = urgent   + important
 *   Q2 = !urgent  + important
 *   Q3 = urgent   + !important
 *   Q4 = !urgent  + !important
 *
 * Score 0–100: used to rank orders within the same quadrant.
 */
function classify({ deadline, quantity, unit, complexity, clientPriority }) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDeadline = (deadlineDate - now) / msPerDay;

  // ── Urgency ──────────────────────────────────────────────────────────────
  let urgency = false;
  if (daysUntilDeadline < 3) {
    urgency = true;
  } else if (daysUntilDeadline <= 7) {
    urgency = complexity === 'HIGH' || quantity > 100;
  } else {
    urgency = complexity === 'HIGH' && quantity > 500;
  }

  // ── Importance ───────────────────────────────────────────────────────────
  const importance =
    clientPriority === 'PREMIUM' ||
    quantity > 200 ||
    complexity === 'HIGH';

  // ── Quadrant ─────────────────────────────────────────────────────────────
  let quadrant;
  if (urgency && importance)   quadrant = 'Q1';
  else if (!urgency && importance) quadrant = 'Q2';
  else if (urgency && !importance) quadrant = 'Q3';
  else                             quadrant = 'Q4';

  // ── Score 0–100 (higher = higher priority within quadrant) ───────────────
  let score = 0;

  // Time factor — 40 pts
  if (daysUntilDeadline <= 0)       score += 40;
  else if (daysUntilDeadline < 1)   score += 38;
  else if (daysUntilDeadline < 2)   score += 35;
  else if (daysUntilDeadline < 3)   score += 30;
  else if (daysUntilDeadline <= 5)  score += 22;
  else if (daysUntilDeadline <= 7)  score += 15;
  else if (daysUntilDeadline <= 14) score += 8;
  else                               score += 3;

  // Complexity factor — 20 pts
  if (complexity === 'HIGH')         score += 20;
  else if (complexity === 'MEDIUM')  score += 10;
  else                               score += 4;

  // Quantity factor — 20 pts
  if (quantity > 1000)      score += 20;
  else if (quantity > 500)  score += 16;
  else if (quantity > 200)  score += 12;
  else if (quantity > 100)  score += 8;
  else if (quantity > 50)   score += 4;
  else                       score += 2;

  // Client priority factor — 20 pts
  if (clientPriority === 'PREMIUM')   score += 20;
  else                                 score += 8;

  score = Math.min(100, Math.round(score));

  return { urgency, importance, quadrant, score };
}

module.exports = { classify };
