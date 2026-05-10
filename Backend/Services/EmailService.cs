using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace LifeEventsHub.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly IHostEnvironment _env;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IHostEnvironment env)
    {
        _config = config;
        _logger = logger;
        _env = env;
    }

    public async Task SendHtmlEmailAsync(string toAddress, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = _config["Smtp:Host"]?.Trim();
        var from = _config["Smtp:From"]?.Trim();
        if (string.IsNullOrEmpty(from))
            from = "noreply@lifeevents.local";

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(from));
        message.To.Add(MailboxAddress.Parse(toAddress));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        if (string.IsNullOrEmpty(host))
        {
            _logger.LogWarning(
                "SMTP host not configured (Smtp:Host). Email to {To} with subject {Subject} was not sent.",
                toAddress,
                subject);
            if (_env.IsDevelopment())
                _logger.LogInformation("Development preview of HTML email:\n{Html}", htmlBody);
            return;
        }

        var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 587;
        var user = _config["Smtp:User"]?.Trim();
        var password = _config["Smtp:Password"] ?? "";

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable, cancellationToken);
        if (!string.IsNullOrEmpty(user))
            await client.AuthenticateAsync(user, password, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
