namespace LifeEventsHub.Api.Services;

public interface IEmailService
{
    Task SendHtmlEmailAsync(string toAddress, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
