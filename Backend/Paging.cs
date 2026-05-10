namespace LifeEventsHub.Api;

/// <summary>Guards all list endpoints from unbounded page sizes (DoS / huge payloads).</summary>
public static class Paging
{
    /// <summary>Default max for public/customer feeds and general lists.</summary>
    public const int MaxPageSize = 50;

    /// <summary>Admin-only lists that may need slightly larger pages (must stay bounded).</summary>
    public const int AdminMaxPageSize = 100;

    public static (int Page, int PageSize) Normalize(int page, int pageSize, int defaultPageSize = 12, int maxPageSize = MaxPageSize)
    {
        var p = page < 1 ? 1 : page;
        var ps = pageSize < 1 ? defaultPageSize : pageSize;
        ps = Math.Clamp(ps, 1, maxPageSize);
        return (p, ps);
    }
}
