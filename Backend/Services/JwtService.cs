using System.IdentityModel.Tokens.Jwt;
using LifeEventsHub.Api.Models;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LifeEventsHub.Api.Services;

public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config) => _config = config;

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "LifeEventsHubSecretKeyForJWT2026Min32Chars!!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var role = string.IsNullOrWhiteSpace(user.Role) ? "Customer" : user.Role;
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "LifeEventsHub",
            audience: _config["Jwt:Audience"] ?? "LifeEventsHub",
            claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public int? GetUserIdFromClaims(ClaimsPrincipal? user)
    {
        var idClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    public string? GetUserEmailFromClaims(ClaimsPrincipal? user)
    {
        return user?.FindFirst(ClaimTypes.Email)?.Value;
    }

    public bool IsAdmin(ClaimsPrincipal? user)
    {
        return string.Equals(user?.FindFirst(ClaimTypes.Role)?.Value, "Admin", StringComparison.OrdinalIgnoreCase);
    }
}
