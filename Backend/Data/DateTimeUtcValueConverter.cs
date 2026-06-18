using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LifeEventsHub.Api.Data;

/// <summary>
/// MySQL datetime columns have no timezone. Values are stored as UTC; mark Kind=Utc on read so JSON includes "Z".
/// </summary>
internal static class DateTimeUtcValueConverter
{
    internal static PropertyBuilder<DateTime> AsUtcTimestamp(this PropertyBuilder<DateTime> property) =>
        property.HasConversion(
            v => NormalizeToUtc(v),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

    internal static PropertyBuilder<DateTime?> AsUtcTimestamp(this PropertyBuilder<DateTime?> property) =>
        property.HasConversion(
            v => v.HasValue ? NormalizeToUtc(v.Value) : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

    private static DateTime NormalizeToUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
}
