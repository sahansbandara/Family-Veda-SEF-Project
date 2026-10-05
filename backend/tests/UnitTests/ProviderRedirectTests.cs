using System.Net;
using FamilyVeda.Application.Agents;
using FamilyVeda.Infrastructure;
using FamilyVeda.Infrastructure.Agents;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FamilyVeda.UnitTests;

public sealed class ProviderRedirectTests
{
    [Theory]
    [InlineData(nameof(GeminiClient))]
    [InlineData(nameof(ChatCompletionsLlmClient))]
    [InlineData(nameof(CloudflareClient))]
    public void CredentialedProviders_RejectAutomaticRedirects(string providerName)
    {
        var services = new ServiceCollection();
        services.AddInfrastructure(new ConfigurationBuilder().Build());
        using var provider = services.BuildServiceProvider();
        var handler = provider.GetRequiredService<IHttpMessageHandlerFactory>().CreateHandler(providerName);
        while (handler is DelegatingHandler delegated) handler = delegated.InnerHandler!;
        handler.Should().BeOfType<HttpClientHandler>().Which.AllowAutoRedirect.Should().BeFalse();
    }

    [Fact]
    public async Task UnexpectedRedirect_IsBoundedFailureWithoutRedirectedRequest()
    {
        var handler = new RedirectHandler();
        var action = () => CloudflareClientTests.Create(handler).GenerateStructuredAsync<MemberContextOutput>("Synthetic", new { }, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>();
        handler.Urls.Should().HaveCount(2).And.OnlyContain(url => url!.Host == "api.cloudflare.com");
    }

    private sealed class RedirectHandler : HttpMessageHandler
    {
        public List<Uri?> Urls { get; } = [];
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Urls.Add(request.RequestUri);
            var response = new HttpResponseMessage(HttpStatusCode.TemporaryRedirect) { Content = new StringContent("{}") };
            response.Headers.Location = new Uri("https://unexpected.synthetic.invalid/");
            return Task.FromResult(response);
        }
    }
}
