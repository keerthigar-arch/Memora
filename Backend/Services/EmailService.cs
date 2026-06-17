using System.Linq;
using System.Text.RegularExpressions;
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
        // Development-only: no SMTP, no credentials — log full message so forgot-password etc. can be tested locally.
        if (_env.IsDevelopment() && _config.GetValue("Smtp:DevLogOnly", false))
        {
            LogDevModeEmail(toAddress, subject, htmlBody);
            await Task.CompletedTask;
            return;
        }

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
        // Gmail app passwords are shown with spaces; SMTP uses the 16 chars without them.
        var password = string.Concat((_config["Smtp:Password"] ?? "").Where(c => !char.IsWhiteSpace(c)));

        if (!string.IsNullOrEmpty(user) && string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException(
                "SMTP password is not configured. Set Smtp:Password in appsettings.{Environment}.local.json " +
                "(see repo .gitignore), or set the environment variable Smtp__Password. " +
                "Use a Gmail App Password for the same account as Smtp:User.");
        }

        using var client = new SmtpClient();
        // Gmail on 587 expects STARTTLS explicitly; avoids rare negotiation issues.
        var ssl = port == 587 && host.Contains("gmail", StringComparison.OrdinalIgnoreCase)
            ? SecureSocketOptions.StartTls
            : SecureSocketOptions.StartTlsWhenAvailable;
        await client.ConnectAsync(host, port, ssl, cancellationToken);
        if (!string.IsNullOrEmpty(user))
        {
            if (_env.IsDevelopment())
            {
                _logger.LogInformation(
                    "SMTP signing in as {SmtpUser} (password length {PasswordLen}, environment {Environment})",
                    user,
                    password.Length,
                    _env.EnvironmentName);
            }

            try
            {
                await client.AuthenticateAsync(user, password, cancellationToken);
            }
            catch (AuthenticationException ex) when (host.Contains("gmail", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Gmail rejected the SMTP login (535). This is almost always the wrong secret for this mailbox: " +
                    "create a new App Password in Google Account → Security while signed in as the same Google account as Smtp:User (" +
                    user + "), paste the 16 characters into Smtp:Password (or dotnet user-secrets), restart the API, and try again. " +
                    "Do not use your normal Gmail password. If this is a Workspace account, your admin may block SMTP.",
                    ex);
            }
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private void LogDevModeEmail(string toAddress, string subject, string htmlBody)
    {
        _logger.LogWarning(
            "Smtp:DevLogOnly=true — email was not sent over the network. Copy any links from the log below. " +
            "For real Gmail delivery set Smtp:DevLogOnly to false and configure Smtp:Password.");
        _logger.LogInformation(
            "[Dev email] To={To}, Subject={Subject}",
            toAddress,
            subject);

        var href = Regex.Match(htmlBody, @"href\s*=\s*[""']([^""']+)[""']", RegexOptions.IgnoreCase);
        if (href.Success)
            _logger.LogInformation("[Dev email] Link: {Link}", href.Groups[1].Value);

        _logger.LogInformation("[Dev email] HTML body:\n{Html}", htmlBody);
    }
}
