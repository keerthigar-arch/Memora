using System.Security.Claims;
using System.Text;
using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.local.json",
    optional: true,
    reloadOnChange: true);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(b => b.NoCache());
    options.AddPolicy("CountryStats", b => b.Expire(TimeSpan.FromMinutes(2)));
});
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddEndpointsApiExplorer();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "LifeEventsHubSecretKeyForJWT2026Min32Chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LifeEventsHub",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LifeEventsHub",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Memora API", Version = "v1" });
});

var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=lifeeventshub;User=root;Password=root;";

// Create database if it doesn't exist
var connBuilder = new MySqlConnectionStringBuilder(connStr);
var database = connBuilder.Database;
connBuilder.Database = "";
using (var conn = new MySqlConnection(connBuilder.ConnectionString))
{
    await conn.OpenAsync();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = $"CREATE DATABASE IF NOT EXISTS `{database}`";
    await cmd.ExecuteNonQueryAsync();
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connStr, new MySqlServerVersion(new Version(8, 0, 21))));

builder.Services.AddScoped<FileStorageService>();
builder.Services.AddScoped<LifeEventsHub.Api.Services.IEmailService, LifeEventsHub.Api.Services.EmailService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddSingleton<PricingService>();
builder.Services.AddSingleton<StripeService>();
builder.Services.AddScoped<PricingOrderService>();
builder.Services.AddScoped<AdminCustomerListService>();
builder.Services.AddScoped<AdminNotificationService>();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? new[]
    {
        "http://localhost:4200",
        "http://localhost:4201",
        "http://localhost:56604",
        "http://localhost:56605",
        "http://localhost:3000"
    };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

var mediaRoot = Path.GetFullPath(app.Configuration["FileStorage:RootPath"] ?? Path.Combine("C:", "events"));
Directory.CreateDirectory(mediaRoot);

var configuredEventPath = app.Configuration["FileStorage:EventPath"];
var eventMediaRoot = Path.GetFullPath(
    string.IsNullOrWhiteSpace(configuredEventPath)
        ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "Memora", "Event")
        : configuredEventPath);
Directory.CreateDirectory(eventMediaRoot);

var configuredAdminProfile = app.Configuration["FileStorage:AdminProfilePath"];
var adminProfileRoot = Path.GetFullPath(
    string.IsNullOrWhiteSpace(configuredAdminProfile)
        ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "Memora-AdminProfile")
        : configuredAdminProfile);
Directory.CreateDirectory(adminProfileRoot);

var configuredCustomerProfile = app.Configuration["FileStorage:CustomerProfilePath"];
var customerProfileRoot = Path.GetFullPath(
    string.IsNullOrWhiteSpace(configuredCustomerProfile)
        ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "Memora", "Profile")
        : configuredCustomerProfile);
Directory.CreateDirectory(customerProfileRoot);

app.UseResponseCompression();
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(mediaRoot),
    RequestPath = FileStorageService.MediaRequestPath
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(eventMediaRoot),
    RequestPath = FileStorageService.EventMediaRequestPath
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(customerProfileRoot),
    RequestPath = FileStorageService.CustomerProfileRequestPath
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(adminProfileRoot),
    RequestPath = FileStorageService.AdminProfileRequestPath
});
app.UseCors("AllowAngular");
app.UseOutputCache();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();

    async Task<bool> ColumnExistsAsync(string table, string column)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @table
              AND COLUMN_NAME = @column
            """;
        var tableParam = command.CreateParameter();
        tableParam.ParameterName = "@table";
        tableParam.Value = table;
        command.Parameters.Add(tableParam);
        var columnParam = command.CreateParameter();
        columnParam.ParameterName = "@column";
        columnParam.Value = column;
        command.Parameters.Add(columnParam);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
    }

    async Task<bool> IndexExistsAsync(string table, string indexName)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @table
              AND INDEX_NAME = @index
            """;
        var tableParam = command.CreateParameter();
        tableParam.ParameterName = "@table";
        tableParam.Value = table;
        command.Parameters.Add(tableParam);
        var indexParam = command.CreateParameter();
        indexParam.ParameterName = "@index";
        indexParam.Value = indexName;
        command.Parameters.Add(indexParam);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
    }

    async Task AddColumnIfMissingAsync(string table, string column, string alterSql)
    {
        if (!await ColumnExistsAsync(table, column))
            await db.Database.ExecuteSqlRawAsync(alterSql);
    }

    async Task DropColumnIfExistsAsync(string table, string column)
    {
        if (await ColumnExistsAsync(table, column))
            await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{table}` DROP COLUMN `{column}`");
    }

    async Task CreateIndexIfMissingAsync(string table, string indexName, string createSql)
    {
        if (!await IndexExistsAsync(table, indexName))
            await db.Database.ExecuteSqlRawAsync(createSql);
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS `PasswordResetTokens` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `UserId` int NOT NULL,
              `Token` varchar(128) NOT NULL,
              `ExpiresAt` datetime(6) NOT NULL,
              `CreatedAt` datetime(6) NOT NULL,
              `UsedAt` datetime(6) NULL,
              PRIMARY KEY (`Id`),
              UNIQUE KEY `IX_PasswordResetTokens_Token` (`Token`),
              KEY `IX_PasswordResetTokens_UserId` (`UserId`),
              CONSTRAINT `FK_PasswordResetTokens_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
    }
    catch
    {
        /* Table may already exist with same definition. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS `PricingOrders` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `ReferenceCode` varchar(40) NULL,
              `Status` varchar(32) NOT NULL DEFAULT 'pending_payment',
              `PaymentChannel` varchar(16) NOT NULL DEFAULT '',
              `Category` varchar(64) NOT NULL DEFAULT '',
              `Country` varchar(64) NOT NULL DEFAULT '',
              `PackageColumnIndex` int NOT NULL,
              `PackageDayLabel` varchar(48) NOT NULL DEFAULT '',
              `AmountDisplay` varchar(64) NOT NULL DEFAULT '',
              `WordLimitDisplay` varchar(120) NOT NULL DEFAULT '',
              `CurrencyCode` varchar(16) NOT NULL DEFAULT 'USD',
              `CustomerName` varchar(160) NOT NULL DEFAULT '',
              `CustomerPhone` varchar(48) NOT NULL DEFAULT '',
              `CustomerEmail` varchar(200) NOT NULL DEFAULT '',
              `StripeSessionId` varchar(128) NULL,
              `StripePaymentIntentId` varchar(128) NULL,
              `PaidAmountMinorUnits` bigint NULL,
              `PaidCurrencyCode` varchar(16) NULL,
              `DirectManualPaymentReceived` tinyint(1) NOT NULL DEFAULT 0,
              `DirectManualPaymentMarkedAt` datetime(6) NULL,
              `CreatedAt` datetime(6) NOT NULL,
              `CompletedAt` datetime(6) NULL,
              PRIMARY KEY (`Id`),
              UNIQUE KEY `IX_PricingOrders_ReferenceCode` (`ReferenceCode`),
              KEY `IX_PricingOrders_CreatedAt` (`CreatedAt`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
    }
    catch
    {
        /* Table may already exist. */
    }

    await AddColumnIfMissingAsync("PricingOrders", "StripePaymentIntentId",
        "ALTER TABLE `PricingOrders` ADD COLUMN `StripePaymentIntentId` varchar(128) NULL");
    await AddColumnIfMissingAsync("PricingOrders", "PaidAmountMinorUnits",
        "ALTER TABLE `PricingOrders` ADD COLUMN `PaidAmountMinorUnits` bigint NULL");
    await AddColumnIfMissingAsync("PricingOrders", "PaidCurrencyCode",
        "ALTER TABLE `PricingOrders` ADD COLUMN `PaidCurrencyCode` varchar(16) NULL");
    await AddColumnIfMissingAsync("PricingOrders", "DirectManualPaymentReceived",
        "ALTER TABLE `PricingOrders` ADD COLUMN `DirectManualPaymentReceived` tinyint(1) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("PricingOrders", "DirectManualPaymentMarkedAt",
        "ALTER TABLE `PricingOrders` ADD COLUMN `DirectManualPaymentMarkedAt` datetime(6) NULL");


    await AddColumnIfMissingAsync("Users", "Role",
        "ALTER TABLE `Users` ADD COLUMN `Role` varchar(20) NOT NULL DEFAULT 'Customer'");
    await db.Database.ExecuteSqlRawAsync(
        "UPDATE `Users` SET `Role` = 'Customer' WHERE `Role` IS NULL OR `Role` = ''");
    await AddColumnIfMissingAsync("Users", "MustChangePassword",
        "ALTER TABLE `Users` ADD COLUMN `MustChangePassword` tinyint(1) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("Users", "UserName",
        "ALTER TABLE `Users` ADD COLUMN `UserName` varchar(64) NULL");
    await CreateIndexIfMissingAsync("Users", "IX_Users_UserName",
        "CREATE UNIQUE INDEX `IX_Users_UserName` ON `Users` (`UserName`)");

    await CreateIndexIfMissingAsync("Events", "IX_Events_UserId_CreatedAt",
        "CREATE INDEX `IX_Events_UserId_CreatedAt` ON `Events` (`UserId`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("Events", "IX_Events_IsPublished_CreatedAt",
        "CREATE INDEX `IX_Events_IsPublished_CreatedAt` ON `Events` (`IsPublished`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("Events", "IX_Events_DisplayValidityEndDate",
        "CREATE INDEX `IX_Events_DisplayValidityEndDate` ON `Events` (`DisplayValidityEndDate`)");
    await CreateIndexIfMissingAsync("Events", "IX_Events_Feed",
        "CREATE INDEX `IX_Events_Feed` ON `Events` (`IsPublished`, `Visibility`, `DisplayValidityEndDate`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("Events", "IX_Events_Type_Published_Created",
        "CREATE INDEX `IX_Events_Type_Published_Created` ON `Events` (`EventType`, `IsPublished`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("Events", "IX_Events_Country",
        "CREATE INDEX `IX_Events_Country` ON `Events` (`Country`)");
    await CreateIndexIfMissingAsync("Wishes", "IX_Wishes_CreatedAt",
        "CREATE INDEX `IX_Wishes_CreatedAt` ON `Wishes` (`CreatedAt`)");
    await CreateIndexIfMissingAsync("Wishes", "IX_Wishes_EventId",
        "CREATE INDEX `IX_Wishes_EventId` ON `Wishes` (`EventId`)");
    await CreateIndexIfMissingAsync("Wishes", "IX_Wishes_EventId_CreatedAt",
        "CREATE INDEX `IX_Wishes_EventId_CreatedAt` ON `Wishes` (`EventId`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("EventInvites", "IX_EventInvites_InvitedEmail",
        "CREATE INDEX `IX_EventInvites_InvitedEmail` ON `EventInvites` (`InvitedEmail`)");
    await CreateIndexIfMissingAsync("PendingEvents", "IX_PendingEvents_UserId",
        "CREATE INDEX `IX_PendingEvents_UserId` ON `PendingEvents` (`UserId`)");
    await CreateIndexIfMissingAsync("PendingEvents", "IX_PendingEvents_AwaitingOffline",
        "CREATE INDEX `IX_PendingEvents_AwaitingOffline` ON `PendingEvents` (`AwaitingOfflineApproval`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("PricingOrders", "IX_PricingOrders_Status_CreatedAt",
        "CREATE INDEX `IX_PricingOrders_Status_CreatedAt` ON `PricingOrders` (`Status`, `CreatedAt`)");
    await CreateIndexIfMissingAsync("PricingOrders", "IX_PricingOrders_StripeSessionId",
        "CREATE INDEX `IX_PricingOrders_StripeSessionId` ON `PricingOrders` (`StripeSessionId`)");
    await CreateIndexIfMissingAsync("AdminNotifications", "IX_AdminNotifications_IsRead_CreatedAt",
        "CREATE INDEX `IX_AdminNotifications_IsRead_CreatedAt` ON `AdminNotifications` (`IsRead`, `CreatedAt`)");

    await AddColumnIfMissingAsync("Events", "PaymentReceived",
        "ALTER TABLE `Events` ADD COLUMN `PaymentReceived` tinyint(1) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("PendingEvents", "PaymentReceived",
        "ALTER TABLE `PendingEvents` ADD COLUMN `PaymentReceived` tinyint(1) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("PendingEvents", "AwaitingOfflineApproval",
        "ALTER TABLE `PendingEvents` ADD COLUMN `AwaitingOfflineApproval` tinyint(1) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("PendingEvents", "OfflineSubmittedAt",
        "ALTER TABLE `PendingEvents` ADD COLUMN `OfflineSubmittedAt` datetime(6) NULL");
    await AddColumnIfMissingAsync("PendingEvents", "PaymentMethod",
        "ALTER TABLE `PendingEvents` ADD COLUMN `PaymentMethod` varchar(20) NULL");
    await AddColumnIfMissingAsync("Events", "CurrencyCode",
        "ALTER TABLE `Events` ADD COLUMN `CurrencyCode` varchar(16) NOT NULL DEFAULT 'USD'");
    await AddColumnIfMissingAsync("Events", "AmountGBP",
        "ALTER TABLE `Events` ADD COLUMN `AmountGBP` decimal(18,4) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("Events", "AmountPaid",
        "ALTER TABLE `Events` ADD COLUMN `AmountPaid` decimal(18,4) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("Events", "ExchangeRateUsed",
        "ALTER TABLE `Events` ADD COLUMN `ExchangeRateUsed` decimal(18,6) NOT NULL DEFAULT 1");
    await AddColumnIfMissingAsync("Events", "VideoUrls",
        "ALTER TABLE `Events` ADD COLUMN `VideoUrls` longtext NULL");
    await AddColumnIfMissingAsync("PendingEvents", "VideoPathsJson",
        "ALTER TABLE `PendingEvents` ADD COLUMN `VideoPathsJson` longtext NULL");

    try
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS `AdminNotifications` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `EventId` int NULL,
              `PendingEventId` int NULL,
              `Kind` varchar(40) NOT NULL,
              `IsRead` tinyint(1) NOT NULL DEFAULT 0,
              `ReadAt` datetime(6) NULL,
              `CreatedAt` datetime(6) NOT NULL,
              PRIMARY KEY (`Id`),
              KEY `IX_AdminNotifications_CreatedAt` (`CreatedAt`),
              KEY `IX_AdminNotifications_EventId` (`EventId`),
              KEY `IX_AdminNotifications_PendingEventId` (`PendingEventId`),
              KEY `IX_AdminNotifications_IsRead` (`IsRead`)
            )
            """);
    }
    catch { }

    await AddColumnIfMissingAsync("AdminNotifications", "IsRead",
        "ALTER TABLE `AdminNotifications` ADD COLUMN `IsRead` tinyint(1) NOT NULL DEFAULT 0");
    await AddColumnIfMissingAsync("AdminNotifications", "ReadAt",
        "ALTER TABLE `AdminNotifications` ADD COLUMN `ReadAt` datetime(6) NULL");

    try
    {
        var readsTableExists = await db.Database.SqlQueryRaw<int>(
            """
            SELECT COUNT(*) AS Value
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AdminNotificationReads'
            """).FirstOrDefaultAsync();
        if (readsTableExists > 0)
        {
            await db.Database.ExecuteSqlRawAsync("""
                UPDATE `AdminNotifications` n
                SET n.`IsRead` = 1,
                    n.`ReadAt` = COALESCE(
                        (SELECT MIN(r.`ReadAt`) FROM `AdminNotificationReads` r WHERE r.`NotificationId` = n.`Id`),
                        UTC_TIMESTAMP(6))
                WHERE EXISTS (SELECT 1 FROM `AdminNotificationReads` r WHERE r.`NotificationId` = n.`Id`)
                """);
        }
    }
    catch { }

    await DropColumnIfExistsAsync("AdminNotifications", "Title");
    await DropColumnIfExistsAsync("AdminNotifications", "EventType");
    await DropColumnIfExistsAsync("AdminNotifications", "CustomerDisplayName");

    try
    {
        await db.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS `AdminNotificationReads`");
    }
    catch { }

    if (app.Environment.IsDevelopment())
    {
        var testEmail = "test@example.com";
        var testUser = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == testEmail);
        if (testUser == null)
        {
            db.Users.Add(new LifeEventsHub.Api.Models.User
            {
                Email = testEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                DisplayName = "Test User",
                ProfileVisibility = "Public",
                CreatedAt = DateTime.UtcNow,
                Role = "Admin"
            });
            await db.SaveChangesAsync();
        }
        else if (testUser.Role != "Admin")
        {
            await db.Users.Where(u => u.Id == testUser.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, "Admin"));
        }
    }

    var notifications = scope.ServiceProvider.GetRequiredService<AdminNotificationService>();
    await notifications.CleanupStaleNotificationsAsync();
}

app.Run();
