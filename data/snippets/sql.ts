import type { SnippetSet } from './types';

export const sql: SnippetSet = {
  short: [
    `SELECT u.id, u.username, u.email, u.last_login_at
FROM users u
WHERE u.status = 'active'
  AND u.last_login_at >= NOW() - INTERVAL '30 days'
ORDER BY u.last_login_at DESC
LIMIT 50;`,
    `INSERT INTO user_preferences (user_id, theme, font_size, updated_at)
VALUES ($1, 'dark', 16, NOW())
ON CONFLICT (user_id)
DO UPDATE SET
  theme = EXCLUDED.theme,
  font_size = EXCLUDED.font_size,
  updated_at = NOW();`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scores_user_wpm
ON typing_scores (user_id, wpm DESC)
WHERE accuracy >= 95.0;`,
    `SELECT
  id,
  title,
  metadata->>'author' AS author_name,
  (metadata->'stats'->>'views')::INTEGER AS total_views
FROM articles
WHERE metadata @> '{"published": true}';`,
    `SELECT
  recorded_at,
  wpm,
  wpm - LAG(wpm, 1) OVER (ORDER BY recorded_at) AS speed_delta
FROM test_results
WHERE user_id = $1;`,
    `UPDATE subscriptions
SET
  status = 'canceled',
  canceled_at = NOW(),
  auto_renew = FALSE
WHERE id = $1 AND status = 'active';`,
  ],
  medium: [
    `SELECT
  c.id AS category_id,
  c.name AS category_name,
  COUNT(p.id) AS total_products,
  ROUND(AVG(p.price), 2) AS avg_price,
  SUM(p.stock_quantity) AS total_inventory
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
GROUP BY c.id, c.name
HAVING COUNT(p.id) >= 5
ORDER BY total_inventory DESC;`,
    `WITH RECURSIVE CommentTree AS (
  SELECT id, parent_id, author_id, body, 1 AS depth, ARRAY[id] AS path
  FROM comments
  WHERE parent_id IS NULL AND post_id = $1

  UNION ALL

  SELECT c.id, c.parent_id, c.author_id, c.body, ct.depth + 1, ct.path || c.id
  FROM comments c
  JOIN CommentTree ct ON c.parent_id = ct.id
  WHERE ct.depth < 10
)
SELECT id, parent_id, body, depth, path
FROM CommentTree
ORDER BY path;`,
    `SELECT
  DATE_TRUNC('month', created_at) AS report_month,
  COUNT(*) AS total_signups,
  COUNT(*) FILTER (WHERE plan_tier = 'enterprise') AS enterprise_count,
  COUNT(*) FILTER (WHERE plan_tier = 'pro') AS pro_count,
  ROUND(AVG(initial_mrr) FILTER (WHERE initial_mrr > 0), 2) AS avg_mrr
FROM accounts
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY report_month DESC;`,
    `SELECT
  p.id,
  p.title,
  p.snippet,
  ts_rank_cd(p.search_vector, query) AS rank
FROM posts p,
     to_tsquery('english', 'performance & postgres') query
WHERE p.search_vector @@ query
ORDER BY rank DESC
LIMIT 20;`,
    `CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN
    INSERT INTO user_audit_logs (user_id, action, changed_fields, performed_at)
    VALUES (
      OLD.id,
      TG_OP,
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
    `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_leaderboards AS
SELECT
  l.language_id,
  s.user_id,
  MAX(s.wpm) AS best_wpm,
  AVG(s.accuracy) AS avg_accuracy,
  COUNT(s.id) AS tests_completed
FROM typing_scores s
JOIN programming_languages l ON s.language_id = l.id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY l.language_id, s.user_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_lang_user
ON mv_daily_leaderboards (language_id, user_id);`,
  ],
  long: [
    `WITH user_cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', MIN(created_at)) AS cohort_month
  FROM test_sessions
  GROUP BY user_id
),
activity_months AS (
  SELECT
    s.user_id,
    c.cohort_month,
    EXTRACT(YEAR FROM AGE(DATE_TRUNC('month', s.created_at), c.cohort_month)) * 12 +
    EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', s.created_at), c.cohort_month)) AS month_number
  FROM test_sessions s
  JOIN user_cohorts c ON s.user_id = c.user_id
  GROUP BY s.user_id, c.cohort_month, month_number
)
SELECT
  cohort_month,
  COUNT(DISTINCT user_id) AS cohort_size,
  COUNT(DISTINCT CASE WHEN month_number = 1 THEN user_id END) AS m1_active,
  COUNT(DISTINCT CASE WHEN month_number = 2 THEN user_id END) AS m2_active,
  COUNT(DISTINCT CASE WHEN month_number = 3 THEN user_id END) AS m3_active
FROM activity_months
GROUP BY cohort_month
ORDER BY cohort_month DESC;`,
    `SELECT
  t.id,
  t.user_id,
  t.wpm,
  t.accuracy,
  t.created_at
FROM typing_scores t
WHERE (t.created_at, t.id) < ($1::TIMESTAMPTZ, $2::BIGINT)
  AND t.language = 'rust'
  AND t.duration = 60
ORDER BY t.created_at DESC, t.id DESC
LIMIT 25;`,
    `WITH next_task AS (
  SELECT id
  FROM background_jobs
  WHERE queue = 'webhooks'
    AND status = 'pending'
    AND scheduled_at <= NOW()
  ORDER BY priority DESC, id ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE background_jobs j
SET
  status = 'processing',
  locked_by = 'worker-node-04',
  locked_at = NOW(),
  attempts = j.attempts + 1
FROM next_task
WHERE j.id = next_task.id
RETURNING j.id, j.payload, j.attempts;`,
    `BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT DEFAULT '' NOT NULL;
    ALTER TABLE profiles ADD COLUMN karma INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_karma
ON profiles (karma DESC)
WHERE karma > 0;

INSERT INTO schema_migrations (version, executed_at)
VALUES ('20261107_add_bio_and_karma', NOW());

COMMIT;`,
    `WITH RankedLeaderboard AS (
  SELECT
    s.id,
    s.user_id,
    p.username,
    s.language,
    s.wpm,
    s.accuracy,
    DENSE_RANK() OVER (
      PARTITION BY s.language
      ORDER BY s.wpm DESC, s.accuracy DESC
    ) AS rank_in_language,
    PERCENT_RANK() OVER (
      PARTITION BY s.language
      ORDER BY s.wpm ASC
    ) AS percentile
  FROM typing_scores s
  JOIN profiles p ON p.id = s.user_id
  WHERE s.created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  rank_in_language,
  username,
  language,
  wpm,
  accuracy,
  ROUND((percentile * 100)::NUMERIC, 1) AS top_percentile
FROM RankedLeaderboard
WHERE rank_in_language <= 10
ORDER BY language ASC, rank_in_language ASC;`,
    `BEGIN;

WITH verified_order AS (
  SELECT id, customer_id, total_cents
  FROM orders
  WHERE id = $1 AND status = 'pending'
  FOR UPDATE
),
inventory_deduction AS (
  UPDATE products p
  SET stock = p.stock - oi.quantity
  FROM order_items oi
  WHERE oi.order_id = $1
    AND p.id = oi.product_id
    AND p.stock >= oi.quantity
  RETURNING p.id
)
UPDATE orders
SET
  status = 'paid',
  payment_reference = $2,
  updated_at = NOW()
WHERE id = $1;

INSERT INTO audit_events (entity_type, entity_id, action, performed_by)
VALUES ('order', $1, 'payment_settled', 'payment-gateway-webhook');

COMMIT;`,
  ],
};
