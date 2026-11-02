import type { SnippetSet } from './types';

export const csharp: SnippetSet = {
  short: [
    `var total = orders.Where(o => o.Paid).Sum(o => o.Amount);
Console.WriteLine($"Total: {total:C}");`,
    `public static bool IsEmpty(string? value) =>
    string.IsNullOrWhiteSpace(value);`,
    `public static int Clamp(int value, int min, int max) =>
    Math.Clamp(value, min, max);`,
  ],
  medium: [
    `public async Task<User?> GetUserAsync(int id)
{
    var response = await _http.GetAsync($"/users/{id}");
    if (!response.IsSuccessStatusCode) return null;
    return await response.Content.ReadFromJsonAsync<User>();
}`,
    `public record Product(string Name, decimal Price)
{
    public Product WithDiscount(decimal percent) =>
        this with { Price = Price * (1 - percent / 100) };
}`,
    `public static string Truncate(string str, int maxLength)
{
    if (string.IsNullOrEmpty(str) || str.Length <= maxLength) return str;
    return string.Concat(str.AsSpan(0, maxLength), "...");
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

    public int GetStock(string sku) => _stock.GetValueOrDefault(sku, 0);
}`,
    `public static IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}

foreach (var n in Fibonacci().Take(10))
{
    Console.Write($"{n} ");
}`,
    `public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool success, T? val, string? err) =>
        (IsSuccess, Value, Error) = (success, val, err);

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}`,
  ],
};
