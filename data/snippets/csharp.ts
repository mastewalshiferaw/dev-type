import type { SnippetSet } from './types';

export const csharp: SnippetSet = {
  short: [
    `var total = orders.Where(o => o.Paid).Sum(o => o.Amount);
Console.WriteLine($"Total: {total:C}");`,
    `public static bool IsEmpty(string? value) =>
    string.IsNullOrWhiteSpace(value);`,
  ],
  medium: [
    `public async Task<User?> GetUserAsync(int id)
{
    // Returns null when the user does not exist
    var response = await _http.GetAsync($"/users/{id}");
    if (!response.IsSuccessStatusCode) return null;
    return await response.Content.ReadFromJsonAsync<User>();
}`,
    `public record Product(string Name, decimal Price)
{
    public Product WithDiscount(decimal percent) =>
        this with { Price = Price * (1 - percent / 100) };
}`,
  ],
  long: [
    `public class Inventory
{
    private readonly Dictionary<string, int> _stock = new();

    public void Add(string sku, int quantity)
    {
        _stock[sku] = _stock.GetValueOrDefault(sku) + quantity;
    }

    public bool TryRemove(string sku, int quantity)
    {
        if (_stock.GetValueOrDefault(sku) < quantity) return false;
        _stock[sku] -= quantity;
        return true;
    }
}`,
    `public static IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b); // tuple swap
    }
}

foreach (var n in Fibonacci().Take(10))
{
    Console.Write($"{n} ");
}`,
  ],
};
