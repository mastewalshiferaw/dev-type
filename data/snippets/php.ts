import type { SnippetSet } from './types';

export const php: SnippetSet = {
  short: [
    `$names = array_map(fn($u) => $u['name'], $users);
echo implode(', ', $names);`,
    `function slugify(string $text): string {
    return strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $text), '-'));
}`,
  ],
  medium: [
    `function findUser(PDO $db, int $id): ?array {
    // Prepared statements keep the query safe
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}`,
    `enum Status: string {
    case Draft = 'draft';
    case Published = 'published';

    public function label(): string {
        return ucfirst($this->value);
    }
}`,
  ],
  long: [
    `final class Cart
{
    private array $items = [];

    public function add(string $sku, int $qty = 1): void
    {
        $this->items[$sku] = ($this->items[$sku] ?? 0) + $qty;
    }

    public function total(array $prices): float
    {
        $sum = 0.0;
        foreach ($this->items as $sku => $qty) {
            $sum += $prices[$sku] * $qty;
        }
        return round($sum, 2);
    }
}`,
    `<?php

declare(strict_types=1);

# Simple JSON endpoint
header('Content-Type: application/json');

$page = max(1, (int) ($_GET['page'] ?? 1));
$posts = array_slice(loadPosts(), ($page - 1) * 10, 10);

echo json_encode([
    'page' => $page,
    'posts' => $posts,
]);`,
  ],
};
