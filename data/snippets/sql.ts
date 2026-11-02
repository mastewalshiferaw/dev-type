import type { SnippetSet } from './types';

export const sql: SnippetSet = {
  short: [
    `SELECT id, email, created_at FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;`,
    `UPDATE orders SET status = 'shipped', updated_at = NOW()
WHERE id = 4182;`,
    `DELETE FROM sessions
WHERE expires_at < NOW();`,
  ],
  medium: [
    `SELECT c.name, SUM(o.total) AS spend
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY spend DESC
LIMIT 10;`,
    `CREATE TABLE scores (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  wpm INTEGER NOT NULL CHECK (wpm >= 0 AND wpm <= 400),
  accuracy NUMERIC(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
    `SELECT
  department_id,
  COUNT(*) AS total_employees,
  ROUND(AVG(salary), 2) AS average_salary
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;`,
  ],
  long: [
    `WITH daily AS (
  SELECT DATE(created_at) AS day, COUNT(*) AS signups
  FROM users
  GROUP BY DATE(created_at)
)
SELECT
  day,
  signups,
  SUM(signups) OVER (ORDER BY day) AS running_total
FROM daily
WHERE day >= '2024-01-01'
ORDER BY day;`,
    `BEGIN;

UPDATE accounts SET balance = balance - 50
WHERE id = 1 AND balance >= 50;

UPDATE accounts SET balance = balance + 50
WHERE id = 2;

INSERT INTO transfers (from_id, to_id, amount, created_at)
VALUES (1, 2, 50, NOW());

COMMIT;`,
    `WITH RankedScores AS (
  SELECT
    id,
    player_name,
    wpm,
    accuracy,
    ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY wpm DESC, accuracy DESC) as rn
  FROM scores
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT id, player_name, wpm, accuracy
FROM RankedScores
WHERE rn = 1
ORDER BY wpm DESC
LIMIT 50;`,
  ],
};
