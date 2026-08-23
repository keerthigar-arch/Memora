namespace LifeEventsHub.Api.Services;

/// <summary>
/// Local disk + <see cref="MediaRequestPath"/> static files. For very large scale, point <c>FileStorage:RootPath</c> at
/// shared storage or replace URLs with a CDN without changing event/wish API contracts.
/// </summary>
public class FileStorageService
{
    private readonly string _rootPath;
    private readonly string _eventRootPath;
    private readonly string _customerProfileRootPath;
    private readonly string _adminProfileRootPath;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const int MaxFileSize = 5 * 1024 * 1024; // 5MB

    // Videos kept separate from images: never allow video extensions in image slots.
    private static readonly string[] AllowedVideoExtensions = { ".mp4", ".webm", ".mov" };
    private const long MaxVideoFileSize = 100L * 1024 * 1024; // 100MB

    private static readonly string[] AllowedDocumentExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxDocumentFileSize = 10L * 1024 * 1024; // 10MB

    /// <summary>Subfolder under each event id for confirmation documents.</summary>
    public const string DocumentFolderSegment = "document";

    /// <summary>Second path segment for profile photos (not tied to an event).</summary>
    public const string ProfileFolderSegment = "profile";

    /// <summary>URL prefix for event images on disk under Desktop/Memora/Event.</summary>
    public const string EventMediaRequestPath = "/media/event";

    /// <summary>URL prefix for customer profile photos on disk under Desktop/Memora/Profile.</summary>
    public const string CustomerProfileRequestPath = "/media/customer-profile";

    /// <summary>URL prefix for admin profile photos on disk under Desktop/Memora-AdminProfile.</summary>
    public const string AdminProfileRequestPath = "/media/admin-profile";

    public FileStorageService(IConfiguration configuration)
    {
        _rootPath = configuration["FileStorage:RootPath"] ?? Path.Combine("C:", "events");
        Directory.CreateDirectory(_rootPath);

        var configuredEvent = configuration["FileStorage:EventPath"];
        _eventRootPath = string.IsNullOrWhiteSpace(configuredEvent)
            ? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                "Memora",
                "Event")
            : configuredEvent;
        Directory.CreateDirectory(_eventRootPath);

        var configuredCustomerProfile = configuration["FileStorage:CustomerProfilePath"];
        _customerProfileRootPath = string.IsNullOrWhiteSpace(configuredCustomerProfile)
            ? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                "Memora",
                "Profile")
            : configuredCustomerProfile;
        Directory.CreateDirectory(_customerProfileRootPath);

        var configuredAdmin = configuration["FileStorage:AdminProfilePath"];
        _adminProfileRootPath = string.IsNullOrWhiteSpace(configuredAdmin)
            ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "Memora-AdminProfile")
            : configuredAdmin;
        Directory.CreateDirectory(_adminProfileRootPath);
    }

    /// <summary>Physical root on disk for customer profile images (e.g. <c>C:\events</c>).</summary>
    public string GetPhysicalRoot() => _rootPath;

    /// <summary>Physical root for event images: <c>Desktop/Memora/Event</c>.</summary>
    public string GetEventPhysicalRoot() => _eventRootPath;

    /// <summary>Physical root for customer profile images: <c>Desktop/Memora/Profile</c>.</summary>
    public string GetCustomerProfilePhysicalRoot() => _customerProfileRootPath;

    /// <summary>Physical folder for admin portal profile photos.</summary>
    public string GetAdminProfilePhysicalRoot() => _adminProfileRootPath;

    /// <summary>Virtual URL prefix for legacy profile files (served under this request path).</summary>
    public const string MediaRequestPath = "/media";

    /// <summary>
    /// Saves under <c>Desktop/Memora/Event/{serialNumber}/{guid}{ext}</c>.
    /// <paramref name="serialNumber"/> is the draft or published event id.
    /// Returns relative URL <c>/media/event/{serialNumber}/{fileName}</c>.
    /// </summary>
    public async Task<string?> SaveFileAsync(IFormFile file, int userId, int serialNumber)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_eventRootPath, serialNumber.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{EventMediaRequestPath}/{serialNumber}/{fileName}";
    }

    /// <summary>
    /// Saves an event video under <c>Desktop/Memora/Event/{serialNumber}/{guid}{ext}</c>.
    /// Allowed: mp4 / webm / mov, up to 100MB. Returns relative URL or null if rejected.
    /// </summary>
    public async Task<string?> SaveVideoFileAsync(IFormFile file, int serialNumber)
    {
        if (file == null || file.Length == 0 || file.Length > MaxVideoFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedVideoExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_eventRootPath, serialNumber.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{EventMediaRequestPath}/{serialNumber}/{fileName}";
    }

    /// <summary>
    /// Saves a confirmation document under <c>Event/{serialNumber}/document/{guid}{ext}</c>.
    /// Allowed: pdf / jpg / jpeg / png / webp, up to 10MB.
    /// Returns relative URL <c>/media/event/{serialNumber}/document/{fileName}</c>.
    /// </summary>
    public async Task<string?> SaveConfirmationDocumentAsync(IFormFile file, int serialNumber)
    {
        if (file == null || file.Length == 0 || file.Length > MaxDocumentFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedDocumentExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_eventRootPath, serialNumber.ToString(), DocumentFolderSegment);
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{EventMediaRequestPath}/{serialNumber}/{DocumentFolderSegment}/{fileName}";
    }

    /// <summary>Legacy profile image: <c>{root}/{userId}/profile/</c>.</summary>
    public Task<string?> SaveProfileImageAsync(IFormFile file, int userId) =>
        SaveLegacyProfileImageAsync(file, userId);

    /// <summary>Customer portal profile image: <c>Desktop/Memora/Profile/{userId}/</c>.</summary>
    public async Task<string?> SaveCustomerProfileImageAsync(IFormFile file, int userId)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_customerProfileRootPath, userId.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{CustomerProfileRequestPath}/{userId}/{fileName}";
    }

    /// <summary>Admin portal profile image: <c>Desktop/Memora-AdminProfile/{userId}/</c>.</summary>
    public async Task<string?> SaveAdminProfileImageAsync(IFormFile file, int userId)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_adminProfileRootPath, userId.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{AdminProfileRequestPath}/{userId}/{fileName}";
    }

    private async Task<string?> SaveLegacyProfileImageAsync(IFormFile file, int userId)
    {
        return await SaveFileAsync(file, userId, ProfileFolderSegment);
    }

    private async Task<string?> SaveFileAsync(IFormFile file, int userId, string folderSegment)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_rootPath, userId.ToString(), folderSegment);
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{MediaRequestPath}/{userId}/{folderSegment}/{fileName}";
    }

    /// <summary>
    /// After a draft becomes a published event, rename <c>Event/{draftId}</c> to <c>Event/{eventId}</c>.
    /// </summary>
    public void MoveDraftFolderToEventId(int userId, int draftId, int eventId)
    {
        if (draftId == eventId)
            return;

        var src = Path.Combine(_eventRootPath, draftId.ToString());
        var dst = Path.Combine(_eventRootPath, eventId.ToString());
        if (!Directory.Exists(src))
        {
            // Legacy layout: {root}/{userId}/{draftId}
            var legacySrc = Path.Combine(_rootPath, userId.ToString(), draftId.ToString());
            if (!Directory.Exists(legacySrc))
                return;

            Directory.CreateDirectory(dst);
            foreach (var file in Directory.EnumerateFiles(legacySrc))
            {
                var name = Path.GetFileName(file);
                File.Copy(file, Path.Combine(dst, name), overwrite: true);
            }
            Directory.Delete(legacySrc, recursive: true);
            return;
        }

        if (Directory.Exists(dst))
        {
            CopyDirectoryContents(src, dst);
            Directory.Delete(src, recursive: true);
            return;
        }

        Directory.Move(src, dst);
    }

    private static void CopyDirectoryContents(string src, string dst)
    {
        Directory.CreateDirectory(dst);
        foreach (var file in Directory.EnumerateFiles(src))
        {
            var name = Path.GetFileName(file);
            File.Copy(file, Path.Combine(dst, name), overwrite: true);
        }
        foreach (var dir in Directory.EnumerateDirectories(src))
        {
            var name = Path.GetFileName(dir);
            CopyDirectoryContents(dir, Path.Combine(dst, name));
        }
    }

    /// <summary>
    /// Rewrites stored media paths when a draft id becomes a published event id.
    /// Supports <c>/media/event/{draftId}/...</c> and legacy <c>/media/{userId}/{draftId}/...</c>.
    /// </summary>
    public static string? RewriteMediaPathAfterPublish(string? pathOrUrl, int userId, int draftId, int eventId)
    {
        if (string.IsNullOrEmpty(pathOrUrl))
            return pathOrUrl;

        var rel = pathOrUrl;
        if (pathOrUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            pathOrUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var u = new Uri(pathOrUrl);
                rel = u.AbsolutePath;
            }
            catch
            {
                return pathOrUrl;
            }
        }

        var eventPrefix = $"{EventMediaRequestPath}/{draftId}/";
        if (rel.StartsWith(eventPrefix, StringComparison.Ordinal))
            return $"{EventMediaRequestPath}/{eventId}/{rel[eventPrefix.Length..]}";

        var legacyPrefix = $"{MediaRequestPath}/{userId}/{draftId}/";
        if (rel.StartsWith(legacyPrefix, StringComparison.Ordinal))
            return $"{EventMediaRequestPath}/{eventId}/{rel[legacyPrefix.Length..]}";

        return pathOrUrl;
    }

    public static string? RewriteGalleryJsonAfterPublish(string? galleryJson, int userId, int draftId, int eventId)
    {
        if (string.IsNullOrEmpty(galleryJson))
            return galleryJson;

        try
        {
            var paths = System.Text.Json.JsonSerializer.Deserialize<string[]>(galleryJson);
            if (paths == null)
                return galleryJson;
            for (var i = 0; i < paths.Length; i++)
                paths[i] = RewriteMediaPathAfterPublish(paths[i], userId, draftId, eventId) ?? paths[i];
            return System.Text.Json.JsonSerializer.Serialize(paths);
        }
        catch
        {
            return galleryJson;
        }
    }

    public string GetBaseUrl(HttpRequest request)
    {
        return $"{request.Scheme}://{request.Host}";
    }

    /// <summary>
    /// DB stores relative media paths (e.g. <c>/media/event/5/x.mp4</c>).
    /// This prefixes them with the API base URL for responses; absolute URLs pass through unchanged.
    /// </summary>
    public static string? NormalizeUrl(string? pathOrUrl, string baseUrl)
    {
        if (string.IsNullOrEmpty(pathOrUrl))
            return pathOrUrl;
        return pathOrUrl.StartsWith('/') && !pathOrUrl.StartsWith("//", StringComparison.Ordinal)
            ? baseUrl + pathOrUrl
            : pathOrUrl;
    }

    /// <summary>Normalizes every entry of a JSON string-array of media paths for API responses.</summary>
    public static string? NormalizeJsonArrayUrls(string? json, string baseUrl)
    {
        if (string.IsNullOrEmpty(json))
            return json;
        try
        {
            var paths = System.Text.Json.JsonSerializer.Deserialize<string[]>(json);
            if (paths == null)
                return json;
            for (var i = 0; i < paths.Length; i++)
                paths[i] = NormalizeUrl(paths[i], baseUrl) ?? paths[i];
            return System.Text.Json.JsonSerializer.Serialize(paths);
        }
        catch
        {
            return json;
        }
    }
}
