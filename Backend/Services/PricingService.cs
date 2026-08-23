using System.Globalization;
using System.Linq;

namespace LifeEventsHub.Api.Services;

public class DisplayOption
{
    public int Days { get; init; }
    public decimal Price { get; init; }
    public string Label { get; init; } = string.Empty;
}

public class PricingService
{
    /// <summary>Fixed USD display plans — same price for every event type and country.</summary>
    private static readonly DisplayOption[] Options =
    {
        new() { Days = 30, Price = 200m, Label = "1 Month" },
        new() { Days = 90, Price = 350m, Label = "3 Months" },
        new() { Days = 180, Price = 500m, Label = "6 Months" },
        new() { Days = 365, Price = 750m, Label = "12 Months" }
    };

    public IReadOnlyList<DisplayOption> GetDisplayOptions() => Options;

    public DisplayOption? GetOption(int days) => Options.FirstOrDefault(o => o.Days == days);

    public decimal GetPrice(int days) => GetOption(days)?.Price ?? 0;

    public PricingPageDto GetPricingPage(string? category, string? country)
    {
        var normalizedCategory = NormalizePricingCategory(category);
        var normalizedCountry = (country ?? "srilanka").Trim().ToLowerInvariant();

        var displayCountry = normalizedCountry switch
        {
            "srilanka" => "Sri Lanka",
            "uk" or "unitedkingdom" => "United Kingdom",
            "canada" => "Canada",
            _ => "Sri Lanka"
        };

        const string currency = "USD";
        var packageDays = Options.Select(o => o.Label).ToArray();
        var priceDisplays = Options.Select(o => FormatUsd(o.Price)).ToArray();

        var matrix = new List<PricingMatrixRowDto>
        {
            new("Price", priceDisplays)
        };

        var contentSections = new List<PricingTextSectionDto>
        {
            new(
                "Event publishing terms",
                new[]
                {
                    "Display plans apply to all event types at the same USD rates.",
                    "Publishing is available for life-event notices and announcements matching your selected event type.",
                    "Support team may request document proof before final approval.",
                    "Changes after publishing are limited and subject to review.",
                    "Content that violates policy may be rejected without publication."
                }),
            new(
                "How to Make Payment",
                new[]
                {
                    "Credit Card, Debit Card, Bank Transfer, and Western Union are accepted.",
                    "After payment, share receipt/reference with support for faster processing.",
                    "For international transfers, mention order number in transfer note."
                }),
            new(
                "Terms & Conditions",
                new[]
                {
                    "All submitted data must be accurate and submitted by authorized individuals.",
                    "False or misleading information can lead to rejection or removal.",
                    "Publishing timeline depends on verification and payment confirmation.",
                    "Service fees are non-refundable once notice has been published.",
                    "By placing an order, you agree to our platform policies and usage terms."
                })
        };

        return new PricingPageDto(
            Category: normalizedCategory,
            Country: normalizedCountry,
            CountryDisplayName: displayCountry,
            CurrencyCode: currency,
            HotlineInternational: "0044 203 137 6284",
            LocalNumbers: new[] { "+44 20 3137 6284", "+94 75 472 7075" },
            PackageDays: packageDays,
            RecommendedIndex: 1,
            Matrix: matrix,
            PaymentMethods: new[] { "Mastercard", "Visa", "PayPal", "American Express", "Bank Transfer", "Western Union" },
            ContentSections: contentSections
        );
    }

    private static string FormatUsd(decimal amount) =>
        amount >= 1000m ? $"${amount:N0}" : $"${amount:0}";

    private static string NormalizePricingCategory(string? category)
    {
        var s = (category ?? "obituary").Trim().ToLowerInvariant().Replace('_', '-');
        if (s == "thankyou")
            s = "other";
        if (s is "puberty" or "pubertyceremony")
            s = "puberty-ceremony";

        var known = new HashSet<string>(StringComparer.Ordinal)
        {
            "birthday", "puberty-ceremony", "wedding", "anniversary", "obituary", "remembrance", "other"
        };
        return known.Contains(s) ? s : "obituary";
    }

    /// <summary>Resolved package column from published pricing matrix (for orders / Stripe).</summary>
    public bool TryGetPublishedPlanPackage(int columnIndex, string? category, string? country,
        out string packageDayLabel, out string amountDisplay, out string wordLimitDisplay,
        out decimal amountMajor, out string stripeCurrencyCode,
        out string normalizedCategory, out string categoryDisplayTitle)
    {
        packageDayLabel = "";
        amountDisplay = "";
        wordLimitDisplay = "—";
        amountMajor = 0;
        stripeCurrencyCode = "usd";
        normalizedCategory = "obituary";
        categoryDisplayTitle = "Obituary";
        var page = GetPricingPage(category, country);
        normalizedCategory = page.Category;
        categoryDisplayTitle = CategoryDisplayTitle(page.Category);
        if (columnIndex < 0 || columnIndex >= page.PackageDays.Count)
            return false;
        var priceRow = page.Matrix.FirstOrDefault(r => r.Feature.Equals("Price", StringComparison.OrdinalIgnoreCase));
        if (priceRow == null || columnIndex >= priceRow.Values.Count)
            return false;
        packageDayLabel = page.PackageDays[columnIndex];
        amountDisplay = priceRow.Values[columnIndex];
        var digits = amountDisplay
            .Replace(",", "", StringComparison.Ordinal)
            .Replace("$", "", StringComparison.Ordinal)
            .Trim();
        if (!decimal.TryParse(digits, NumberStyles.Number, CultureInfo.InvariantCulture, out amountMajor) ||
            amountMajor <= 0)
            return false;
        stripeCurrencyCode = page.CurrencyCode.Trim().ToLowerInvariant();
        return true;
    }

    private static string CategoryDisplayTitle(string normalizedSlug)
    {
        return normalizedSlug switch
        {
            "birthday" => "Birthday",
            "puberty-ceremony" => "Puberty ceremony",
            "wedding" => "Wedding",
            "anniversary" => "Anniversary",
            "obituary" => "Obituary",
            "remembrance" => "Remembrance",
            "other" => "General",
            _ => CultureInfo.InvariantCulture.TextInfo.ToTitleCase(normalizedSlug.Replace('-', ' '))
        };
    }
}

public record PricingMatrixRowDto(string Feature, IReadOnlyList<string> Values);

public record PricingTextSectionDto(string Heading, IReadOnlyList<string> Items);

public record PricingPageDto(
    string Category,
    string Country,
    string CountryDisplayName,
    string CurrencyCode,
    string HotlineInternational,
    IReadOnlyList<string> LocalNumbers,
    IReadOnlyList<string> PackageDays,
    int RecommendedIndex,
    IReadOnlyList<PricingMatrixRowDto> Matrix,
    IReadOnlyList<string> PaymentMethods,
    IReadOnlyList<PricingTextSectionDto> ContentSections
);
