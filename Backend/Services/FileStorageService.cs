namespace LifeEventsHub.Api.Services;

/// <summary>
/// Local disk + <see cref="MediaRequestPath"/> static files. For very large scale, point <c>FileStorage:RootPath</c> at
/// shared storage or replace URLs with a CDN without changing event/wish API contracts.
/// </summary>
public class FileStorageService
{
    private readonly string _rootPath;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const int MaxFileSize = 5 * 1024 * 1024; // 5MB

    /// <summary>Second path segment for profile photos (not tied to an event).</summary>
    public const string ProfileFolderSegment = "profile";

    public FileStorageService(IConfiguration configuration)
    {
        _rootPath = configuration["FileStorage:RootPath"] ?? Path.Combine("C:", "events");
        Directory.CreateDirectory(_rootPath);
    }

    /// <summary>Physical root on disk (e.g. <c>C:\events</c>).</summary>
    public string GetPhysicalRoot() => _rootPath;

    /// <summary>Virtual URL prefix for stored files (served under this request path).</summary>
    public const string MediaRequestPath = "/media";

    /// <summary>
    /// Saves under <c>{root}/{userId}/{eventFolderId}/{guid}{ext}</c>.
    /// Returns relative URL <c>/media/{userId}/{eventFolderId}/{fileName}</c> for storage and retrieval.
    /// </summary>
    public async Task<string?> SaveFileAsync(IFormFile file, int userId, int eventFolderId)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return null;

        var folder = Path.Combine(_rootPath, userId.ToString(), eventFolderId.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{MediaRequestPath}/{userId}/{eventFolderId}/{fileName}";
    }

    /// <summary>Profile image: <c>{root}/{userId}/profile/</c>.</summary>
    public Task<string?> SaveProfileImageAsync(IFormFile file, int userId) =>
        SaveFileAsync(file, userId, folderSegment: ProfileFolderSegment);

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
    /// After a draft becomes a published event, rename <c>{userId}/{draftId}</c> to <c>{userId}/{eventId}</c>.
    /// </summary>
    public void MoveDraftFolderToEventId(int userId, int draftId, int eventId)
    {
        if (draftId == eventId)
            return;

        var src = Path.Combine(_rootPath, userId.ToString(), draftId.ToString());
        var dst = Path.Combine(_rootPath, userId.ToString(), eventId.ToString());
        if (!Directory.Exists(src))
            return;

        if (Directory.Exists(dst))
        {
            foreach (var file in Directory.EnumerateFiles(src))
            {
                var name = Path.GetFileName(file);
                File.Copy(file, Path.Combine(dst, name), overwrite: true);
            }
            Directory.Delete(src, recursive: true);
            return;
        }

        Directory.Move(src, dst);
    }

    /// <summary>
    /// Rewrites <c>/media/{userId}/{draftId}/...</c> to <c>/media/{userId}/{eventId}/...</c>.
    /// Leaves full http(s) URLs unchanged if they don't match the pattern.
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

        var prefix = $"{MediaRequestPath}/{userId}/{draftId}/";
        if (!rel.StartsWith(prefix, StringComparison.Ordinal))
            return pathOrUrl;

        return $"{MediaRequestPath}/{userId}/{eventId}/{rel[prefix.Length..]}";
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
}
