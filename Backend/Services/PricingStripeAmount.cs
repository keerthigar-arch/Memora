namespace LifeEventsHub.Api.Services;

/// <summary>Stripe Checkout unit amounts (minor units) for pricing-plan charges.</summary>
public static class PricingStripeAmount
{
    private static readonly HashSet<string> ZeroDecimal = new(StringComparer.OrdinalIgnoreCase)
    {
        "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"
    };

    public static decimal ToStripeUnitAmount(decimal majorUnits, string currencyLower)
    {
        if (ZeroDecimal.Contains(currencyLower))
            return decimal.Round(majorUnits, 0, MidpointRounding.AwayFromZero);
        return decimal.Round(majorUnits * 100m, 0, MidpointRounding.AwayFromZero);
    }
}
