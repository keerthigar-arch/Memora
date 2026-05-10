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
    private static readonly DisplayOption[] Options =
    {
        new() { Days = 1, Price = 0.99m, Label = "1 day" },
        new() { Days = 3, Price = 1.99m, Label = "3 days" },
        new() { Days = 7, Price = 2.99m, Label = "7 days" },
        new() { Days = 14, Price = 4.99m, Label = "14 days" },
        new() { Days = 30, Price = 7.99m, Label = "30 days" },
        new() { Days = 90, Price = 14.99m, Label = "90 days" }
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

        var currency = normalizedCountry switch
        {
            "uk" or "unitedkingdom" => "GBP",
            "canada" => "CAD",
            _ => "LKR"
        };

        var matrix = new List<PricingMatrixRowDto>
        {
            new("Price", new[] { "36,000", "54,000", "72,000", "90,000", "108,000", "126,000" }),
            new("Word Limit", new[] { "50 words", "70 words", "Unlimited", "Unlimited", "Unlimited", "Unlimited" })
        };

        var packageDays = new[] { "2 Days", "3 Days", "4 Days", "5 Days", "6 Days", "7 Days" };

        var typeTitle = CategoryDisplayTitle(normalizedCategory);
        var contentSections = new List<PricingTextSectionDto>
        {
            new(
                $"{typeTitle} publishing terms",
                new[]
                {
                    "Order requests are reviewed by our team before publication.",
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
            RecommendedIndex: 2,
            Matrix: matrix,
            PaymentMethods: new[] { "Mastercard", "Visa", "PayPal", "American Express", "Bank Transfer", "Western Union" },
            ContentSections: contentSections
        );
    }

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
        wordLimitDisplay = "";
        amountMajor = 0;
        stripeCurrencyCode = "lkr";
        normalizedCategory = "obituary";
        categoryDisplayTitle = "Obituary";
        var page = GetPricingPage(category, country);
        normalizedCategory = page.Category;
        categoryDisplayTitle = CategoryDisplayTitle(page.Category);
        if (columnIndex < 0 || columnIndex >= page.PackageDays.Count)
            return false;
        var priceRow = page.Matrix.FirstOrDefault(r => r.Feature.Equals("Price", StringComparison.OrdinalIgnoreCase));
        var wordRow = page.Matrix.FirstOrDefault(r => r.Feature.Equals("Word Limit", StringComparison.OrdinalIgnoreCase));
        if (priceRow == null || wordRow == null ||
            columnIndex >= priceRow.Values.Count || columnIndex >= wordRow.Values.Count)
            return false;
        packageDayLabel = page.PackageDays[columnIndex];
        amountDisplay = priceRow.Values[columnIndex];
        wordLimitDisplay = wordRow.Values[columnIndex];
        var digits = amountDisplay.Replace(",", "", StringComparison.Ordinal).Trim();
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
