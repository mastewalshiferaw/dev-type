import type { SnippetSet } from './types';

export const sql: SnippetSet = {
  short: [
    `SELECT id, email FROM users
WHERE created_at > NOW() - INTERVAL '7 days';`,
    `UPDATE orders SET status = 'shipped'
WHERE id = 4182;`,
  ],
  medium: [
    `-- Top customers by lifetime spend
SELECT c.name, SUM(o.total) AS spend
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY spend DESC
LIMIT 10;`,
    `CREATE TABLE scores (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  wpm INTEGER NOT NULL CHECK (wpm >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
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

/* Move credit between two accounts atomically */
UPDATE accounts SET balance = balance - 50
WHERE id = 1 AND balance >= 50;

UPDATE accounts SET balance = balance + 50
WHERE id = 2;

INSERT INTO transfers (from_id, to_id, amount)
VALUES (1, 2, 50);

COMMIT;`,
  ],
};
