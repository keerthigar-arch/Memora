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

// ✅ FIXED: Added all possible frontend ports
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "http://localhost:4201",
                "http://localhost:56604",
                "http://localhost:56605",
                "http://localhost:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

var mediaRoot = Path.GetFullPath(app.Configuration["FileStorage:RootPath"] ?? Path.Combine("C:", "events"));
Directory.CreateDirectory(mediaRoot);

// ✅ FIXED: Correct middleware order — project wwwroot + external C:\events (or configured) at /media
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(mediaRoot),
    RequestPath = FileStorageService.MediaRequestPath
});
app.UseCors("AllowAngular");      // Must be before Auth
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
              `CurrencyCode` varchar(16) NOT NULL DEFAULT 'LKR',
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

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `PricingOrders` ADD COLUMN `StripePaymentIntentId` varchar(128) NULL");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `PricingOrders` ADD COLUMN `PaidAmountMinorUnits` bigint NULL");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `PricingOrders` ADD COLUMN `PaidCurrencyCode` varchar(16) NULL");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `PricingOrders` ADD COLUMN `DirectManualPaymentReceived` tinyint(1) NOT NULL DEFAULT 0");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `PricingOrders` ADD COLUMN `DirectManualPaymentMarkedAt` datetime(6) NULL");
    }
    catch { }

    try
    {
        var t = DateTime.UtcNow;
        PricingOrder[] sampleRows =
        [
            new PricingOrder
            {
                ReferenceCode = "MEM-2026-SAMPLE01",
                Status = "direct_open",
                PaymentChannel = "Direct",
                Category = "obituary",
                Country = "srilanka",
                PackageColumnIndex = 1,
                PackageDayLabel = "3 Days",
                AmountDisplay = "54,000",
                WordLimitDisplay = "70 words",
                CurrencyCode = "LKR",
                CustomerName = "Demo · Direct — awaiting bank transfer",
                CustomerPhone = "+94771234567",
                CustomerEmail = "demo.direct.pending@example.com",
                DirectManualPaymentReceived = false,
                CreatedAt = t.AddDays(-7),
                CompletedAt = t.AddDays(-7)
            },
            new PricingOrder
            {
                ReferenceCode = "MEM-2026-SAMPLE02",
                Status = "direct_open",
                PaymentChannel = "Direct",
                Category = "wedding",
                Country = "srilanka",
                PackageColumnIndex = 4,
                PackageDayLabel = "6 Days",
                AmountDisplay = "108,000",
                WordLimitDisplay = "Unlimited",
                CurrencyCode = "LKR",
                CustomerName = "Demo · Direct — manually confirmed paid",
                CustomerPhone = "+94777654321",
                CustomerEmail = "demo.direct.confirmed@example.com",
                DirectManualPaymentReceived = true,
                DirectManualPaymentMarkedAt = t.AddDays(-2),
                CreatedAt = t.AddDays(-10),
                CompletedAt = t.AddDays(-10)
            },
            new PricingOrder
            {
                ReferenceCode = "MEM-2026-SAMPLE03",
                Status = "paid_card",
                PaymentChannel = "Card",
                Category = "birthday",
                Country = "usa",
                PackageColumnIndex = 2,
                PackageDayLabel = "5 Days",
                AmountDisplay = "249.00",
                WordLimitDisplay = "Unlimited",
                CurrencyCode = "USD",
                CustomerName = "Demo · Card — Stripe paid (USD)",
                CustomerPhone = "+1 4155550199",
                CustomerEmail = "demo.card.usd@example.com",
                StripeSessionId = "cs_test_a1MemorialBirthdayUsdCheckout01",
                StripePaymentIntentId = "pi_3SampleUsdBirthday012345678901234",
                PaidAmountMinorUnits = 24900,
                PaidCurrencyCode = "USD",
                DirectManualPaymentReceived = false,
                CreatedAt = t.AddDays(-4),
                CompletedAt = t.AddDays(-4)
            },
            new PricingOrder
            {
                ReferenceCode = "MEM-2026-SAMPLE04",
                Status = "paid_card",
                PaymentChannel = "Card",
                Category = "obituary",
                Country = "germany",
                PackageColumnIndex = 3,
                PackageDayLabel = "7 Days",
                AmountDisplay = "189.50",
                WordLimitDisplay = "Unlimited",
                CurrencyCode = "EUR",
                CustomerName = "Demo · Card — Stripe paid (EUR)",
                CustomerPhone = "+49 3012345678",
                CustomerEmail = "demo.card.eur@example.com",
                StripeSessionId = "cs_test_b2MemorialEuroCheckoutSession02",
                StripePaymentIntentId = "pi_3SampleEurObituary098765432109876",
                PaidAmountMinorUnits = 18950,
                PaidCurrencyCode = "EUR",
                DirectManualPaymentReceived = false,
                CreatedAt = t.AddDays(-6),
                CompletedAt = t.AddDays(-6)
            },
            new PricingOrder
            {
                ReferenceCode = "MEM-2026-SAMPLE05",
                Status = "direct_open",
                PaymentChannel = "Direct",
                Category = "memorial",
                Country = "uk",
                PackageColumnIndex = 2,
                PackageDayLabel = "5 Days",
                AmountDisplay = "£420",
                WordLimitDisplay = "120 words",
                CurrencyCode = "GBP",
                CustomerName = "Demo · Direct — UK bank transfer open",
                CustomerPhone = "+44 7700 900123",
                CustomerEmail = "demo.direct.uk@example.com",
                DirectManualPaymentReceived = false,
                CreatedAt = t.AddDays(-1),
                CompletedAt = t.AddDays(-1)
            },
            new PricingOrder
            {
                ReferenceCode = "MEM-2026-SAMPLE06",
                Status = "paid_card",
                PaymentChannel = "Card",
                Category = "wedding",
                Country = "srilanka",
                PackageColumnIndex = 1,
                PackageDayLabel = "3 Days",
                AmountDisplay = "68,000",
                WordLimitDisplay = "70 words",
                CurrencyCode = "LKR",
                CustomerName = "Demo · Card — paid (LKR)",
                CustomerPhone = "+94770001122",
                CustomerEmail = "demo.card.lkr@example.com",
                StripeSessionId = "cs_test_c3WeddingLkrCheckoutPaid06",
                StripePaymentIntentId = "pi_3SampleLkrWedding060987654321098",
                PaidAmountMinorUnits = 6800000,
                PaidCurrencyCode = "LKR",
                DirectManualPaymentReceived = false,
                CreatedAt = t.AddHours(-18),
                CompletedAt = t.AddHours(-18)
            }
        ];

        foreach (var row in sampleRows)
        {
            var exists = await db.PricingOrders.AnyAsync(o => o.ReferenceCode == row.ReferenceCode);
            if (!exists)
                db.PricingOrders.Add(row);
        }

        await db.SaveChangesAsync();
    }
    catch
    {
        /* Sample seed optional; ignore duplicate key races. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Users` ADD COLUMN `Role` varchar(20) NOT NULL DEFAULT 'Customer'");
    }
    catch
    {
        /* Column already exists when DB was created with an older schema. */
    }

    await db.Database.ExecuteSqlRawAsync(
        "UPDATE `Users` SET `Role` = 'Customer' WHERE `Role` IS NULL OR `Role` = ''");

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Users` ADD COLUMN `MustChangePassword` tinyint(1) NOT NULL DEFAULT 0");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Users` ADD COLUMN `UserName` varchar(64) NULL");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE UNIQUE INDEX `IX_Users_UserName` ON `Users` (`UserName`)");
    }
    catch
    {
        /* Index already exists. */
    }

    /* Performance: large-table scans (feed, admin lists, country stats). Safe to re-run — duplicate index ignored. */
    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX `IX_Events_UserId_CreatedAt` ON `Events` (`UserId`, `CreatedAt`)");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX `IX_Events_IsPublished_CreatedAt` ON `Events` (`IsPublished`, `CreatedAt`)");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX `IX_Events_DisplayValidityEndDate` ON `Events` (`DisplayValidityEndDate`)");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX `IX_Wishes_CreatedAt` ON `Wishes` (`CreatedAt`)");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX `IX_Wishes_EventId` ON `Wishes` (`EventId`)");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX `IX_PricingOrders_Status_CreatedAt` ON `PricingOrders` (`Status`, `CreatedAt`)");
    }
    catch { }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Events` ADD COLUMN `PaymentReceived` tinyint(1) NOT NULL DEFAULT 0");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `PendingEvents` ADD COLUMN `PaymentReceived` tinyint(1) NOT NULL DEFAULT 0");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Events` ADD COLUMN `CurrencyCode` varchar(16) NOT NULL DEFAULT 'USD'");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Events` ADD COLUMN `AmountGBP` decimal(18,4) NOT NULL DEFAULT 0");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Events` ADD COLUMN `AmountPaid` decimal(18,4) NOT NULL DEFAULT 0");
    }
    catch
    {
        /* Column already exists. */
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Events` ADD COLUMN `ExchangeRateUsed` decimal(18,6) NOT NULL DEFAULT 1");
    }
    catch
    {
        /* Column already exists. */
    }

    var testEmail = "test@example.com";
    var testUser = await db.Users.FirstOrDefaultAsync(u => u.Email == testEmail);
    if (testUser == null)
    {
        testUser = new LifeEventsHub.Api.Models.User
        {
            Email = testEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            DisplayName = "Test User",
            ProfileVisibility = "Public",
            CreatedAt = DateTime.UtcNow,
            Role = "Admin"
        };
        db.Users.Add(testUser);
        await db.SaveChangesAsync();
    }
    else if (testUser.Role != "Admin")
    {
        testUser.Role = "Admin";
        await db.SaveChangesAsync();
    }

    // Seed public feed with at least 30 demo events (user requested feed items, not wishes).
    var existingFeedSampleCount = await db.Events.CountAsync(e => e.CreatedBy == "Memora Showcase");
    var eventsNeeded = Math.Max(0, 30 - existingFeedSampleCount);
    if (eventsNeeded > 0)
    {
        var titles = new[]
        {
            "Aadhya's 7th Birthday Celebration", "Silver Jubilee Anniversary Tribute", "In Loving Memory of Mr. Rajan",
            "Twins Birthday Garden Party", "25 Years of Togetherness", "Remembering Dr. Meenakshi",
            "Little Arjun Turns 5", "Ruby Wedding Anniversary", "Memorial Service for Captain Suresh",
            "Nila's Birthday Evening", "Anniversary Blessings for Priya & Karthik", "A Life Well Lived: Mrs. Shanti",
            "Surya's 18th Birthday", "Golden Memories Anniversary", "Tribute to Mr. Kumaran",
            "Anya's Birthday Bash", "Family Anniversary Celebration", "In Memory of Teacher Lakshmi",
            "Diya's Birthday Milestone", "Wedding Anniversary Gathering", "Honoring the Legacy of Mr. Arun",
            "Rishi's Birthday Weekend", "Sacred Anniversary Ceremony", "Remembering Beloved Grandmother",
            "Kavin's Birthday Fest", "Pearl Anniversary Joy", "A Tribute to Mr. Nadarajah",
            "Meera's Birthday Brunch", "Anniversary of Love and Gratitude", "Celebrating the Life of Mrs. Devika"
        };

        var descriptions = new[]
        {
            "A joyful gathering with family and friends filled with gratitude, laughter, and heartfelt wishes.",
            "Commemorating a meaningful milestone with blessings, memories, and warm messages from loved ones.",
            "A respectful remembrance page to honor a cherished life, stories, and condolences.",
            "Celebrating another wonderful year with bright moments, photos, and kind words.",
            "Marking years of companionship and love with a graceful digital keepsake.",
            "A memorial dedicated to treasured memories and the enduring impact of a beloved soul."
        };

        var countries = new[] { "India", "Sri Lanka", "Malaysia", "Singapore", "United Kingdom", "Canada" };
        var locations = new[]
        {
            "Chennai", "Colombo", "Kuala Lumpur", "Singapore", "London", "Toronto"
        };
        var eventTypes = new[] { "Birthday", "Puberty Ceremony", "Wedding", "Anniversary", "Obituary", "Remembrance", "Other" };
        var birthdayImages = new[]
        {
            "https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1600"
        };
        var pubertyImages = new[]
        {
            "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600"
        };
        var weddingImages = new[]
        {
            "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/949590/pexels-photo-949590.jpeg?auto=compress&cs=tinysrgb&w=1600"
        };
        var anniversaryImages = new[]
        {
            "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/949590/pexels-photo-949590.jpeg?auto=compress&cs=tinysrgb&w=1600"
        };
        var obituaryImages = new[]
        {
            "https://images.pexels.com/photos/889839/pexels-photo-889839.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/267967/pexels-photo-267967.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1600"
        };
        var otherImages = new[]
        {
            "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "https://images.pexels.com/photos/433452/pexels-photo-433452.jpeg?auto=compress&cs=tinysrgb&w=1600"
        };
        var now = DateTime.UtcNow;
        var eventsToAdd = new List<LifeEventsHub.Api.Models.Event>();

        for (var i = 0; i < eventsNeeded; i++)
        {
            var idx = (existingFeedSampleCount + i) % 30;
            var type = eventTypes[idx % eventTypes.Length];
            var eventDate = now.AddDays(-(idx % 90));

            DateTime? birthDate = null;
            DateTime? deathDate = null;
            DateTime? weddingDate = null;
            if (type == "Obituary" || type == "Remembrance")
            {
                deathDate = eventDate;
                birthDate = eventDate.AddYears(-68);
            }
            else if (type == "Anniversary" || type == "Wedding")
            {
                weddingDate = eventDate.AddYears(-12);
            }

            string mainImageUrl;
            string galleryJson;
            if (type == "Birthday")
            {
                mainImageUrl = birthdayImages[idx % birthdayImages.Length];
                galleryJson = $"[\"{birthdayImages[(idx + 1) % birthdayImages.Length]}\",\"{birthdayImages[(idx + 2) % birthdayImages.Length]}\"]";
            }
            else if (type == "Puberty Ceremony")
            {
                mainImageUrl = pubertyImages[idx % pubertyImages.Length];
                galleryJson = $"[\"{pubertyImages[(idx + 1) % pubertyImages.Length]}\",\"{pubertyImages[(idx + 2) % pubertyImages.Length]}\"]";
            }
            else if (type == "Wedding")
            {
                mainImageUrl = weddingImages[idx % weddingImages.Length];
                galleryJson = $"[\"{weddingImages[(idx + 1) % weddingImages.Length]}\",\"{weddingImages[(idx + 2) % weddingImages.Length]}\"]";
            }
            else if (type == "Anniversary")
            {
                mainImageUrl = anniversaryImages[idx % anniversaryImages.Length];
                galleryJson = $"[\"{anniversaryImages[(idx + 1) % anniversaryImages.Length]}\",\"{anniversaryImages[(idx + 2) % anniversaryImages.Length]}\"]";
            }
            else if (type == "Obituary" || type == "Remembrance")
            {
                mainImageUrl = obituaryImages[idx % obituaryImages.Length];
                galleryJson = $"[\"{obituaryImages[(idx + 1) % obituaryImages.Length]}\",\"{obituaryImages[(idx + 2) % obituaryImages.Length]}\"]";
            }
            else
            {
                mainImageUrl = otherImages[idx % otherImages.Length];
                galleryJson = $"[\"{otherImages[(idx + 1) % otherImages.Length]}\",\"{otherImages[(idx + 2) % otherImages.Length]}\"]";
            }

            eventsToAdd.Add(new LifeEventsHub.Api.Models.Event
            {
                Title = titles[idx],
                Description = descriptions[idx % descriptions.Length],
                EventType = type,
                EventDate = eventDate,
                BirthDate = birthDate,
                DeathDate = deathDate,
                WeddingDate = weddingDate,
                Location = locations[idx % locations.Length],
                Country = countries[idx % countries.Length],
                CurrencyCode = "USD",
                AmountGBP = 0,
                AmountPaid = 0,
                ExchangeRateUsed = 1,
                MainImageUrl = mainImageUrl,
                GalleryUrls = galleryJson,
                CreatedBy = "Memora Showcase",
                UserId = testUser.Id,
                CreatedAt = now.AddMinutes(-(idx + 1) * 7),
                IsPublished = true,
                Visibility = "Public",
                DisplayDays = 365,
                DisplayValidityEndDate = now.AddDays(365),
                PaymentReceived = true
            });
        }

        db.Events.AddRange(eventsToAdd);
        await db.SaveChangesAsync();
    }

    // Keep existing showcase events aligned with type-relevant images.
    var birthdayImagesUpdate = new[]
    {
        "https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1600"
    };
    var pubertyImagesUpdate = new[]
    {
        "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600"
    };
    var weddingImagesUpdate = new[]
    {
        "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/949590/pexels-photo-949590.jpeg?auto=compress&cs=tinysrgb&w=1600"
    };
    var anniversaryImagesUpdate = new[]
    {
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/949590/pexels-photo-949590.jpeg?auto=compress&cs=tinysrgb&w=1600"
    };
    var obituaryImagesUpdate = new[]
    {
        "https://images.pexels.com/photos/889839/pexels-photo-889839.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/267967/pexels-photo-267967.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1600"
    };
    var otherImagesUpdate = new[]
    {
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1600",
        "https://images.pexels.com/photos/433452/pexels-photo-433452.jpeg?auto=compress&cs=tinysrgb&w=1600"
    };

    var showcaseEvents = await db.Events
        .Where(e => e.CreatedBy == "Memora Showcase")
        .OrderBy(e => e.Id)
        .ToListAsync();

    for (var i = 0; i < showcaseEvents.Count; i++)
    {
        var ev = showcaseEvents[i];
        if (ev.EventType == "Birthday")
        {
            ev.MainImageUrl = birthdayImagesUpdate[i % birthdayImagesUpdate.Length];
            ev.GalleryUrls = $"[\"{birthdayImagesUpdate[(i + 1) % birthdayImagesUpdate.Length]}\",\"{birthdayImagesUpdate[(i + 2) % birthdayImagesUpdate.Length]}\"]";
        }
        else if (ev.EventType == "Puberty Ceremony")
        {
            ev.MainImageUrl = pubertyImagesUpdate[i % pubertyImagesUpdate.Length];
            ev.GalleryUrls = $"[\"{pubertyImagesUpdate[(i + 1) % pubertyImagesUpdate.Length]}\",\"{pubertyImagesUpdate[(i + 2) % pubertyImagesUpdate.Length]}\"]";
        }
        else if (ev.EventType == "Wedding")
        {
            ev.MainImageUrl = weddingImagesUpdate[i % weddingImagesUpdate.Length];
            ev.GalleryUrls = $"[\"{weddingImagesUpdate[(i + 1) % weddingImagesUpdate.Length]}\",\"{weddingImagesUpdate[(i + 2) % weddingImagesUpdate.Length]}\"]";
        }
        else if (ev.EventType == "Anniversary")
        {
            ev.MainImageUrl = anniversaryImagesUpdate[i % anniversaryImagesUpdate.Length];
            ev.GalleryUrls = $"[\"{anniversaryImagesUpdate[(i + 1) % anniversaryImagesUpdate.Length]}\",\"{anniversaryImagesUpdate[(i + 2) % anniversaryImagesUpdate.Length]}\"]";
        }
        else if (ev.EventType == "Obituary" || ev.EventType == "Funeral" || ev.EventType == "Remembrance")
        {
            ev.MainImageUrl = obituaryImagesUpdate[i % obituaryImagesUpdate.Length];
            ev.GalleryUrls = $"[\"{obituaryImagesUpdate[(i + 1) % obituaryImagesUpdate.Length]}\",\"{obituaryImagesUpdate[(i + 2) % obituaryImagesUpdate.Length]}\"]";
        }
        else
        {
            ev.MainImageUrl = otherImagesUpdate[i % otherImagesUpdate.Length];
            ev.GalleryUrls = $"[\"{otherImagesUpdate[(i + 1) % otherImagesUpdate.Length]}\",\"{otherImagesUpdate[(i + 2) % otherImagesUpdate.Length]}\"]";
        }
    }

    if (showcaseEvents.Count > 0)
        await db.SaveChangesAsync();
}

app.Run();