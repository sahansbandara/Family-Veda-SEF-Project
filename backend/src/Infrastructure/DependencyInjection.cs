// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using FamilyVeda.Application.Auth;
using FamilyVeda.Application.Agents;
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Families;
using FamilyVeda.Application.Records;
using FamilyVeda.Application.Triage;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Safety;
using FamilyVeda.Infrastructure.Auth;
using FamilyVeda.Infrastructure.Agents;
using FamilyVeda.Infrastructure.Clinical;
using FamilyVeda.Infrastructure.Families;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Records;
using FamilyVeda.Infrastructure.Triage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FamilyVeda.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=familyveda";
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());
        services.AddScoped<IPasswordHasher<UserAccount>, PasswordHasher<UserAccount>>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFamilyService, FamilyService>();
        services.AddScoped<IRecordService, RecordService>();
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton<IOcrService, TesseractOcrService>();
        services.AddScoped<ILabExtractionService, LabExtractionService>();
        services.AddScoped<ITriageService, TriageService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ICaseSlaProcessor, CaseSlaProcessor>();
        services.AddHttpClient<IPushNotificationClient, FcmPushNotificationClient>(client =>
            client.BaseAddress = new Uri("https://fcm.googleapis.com/"));
        services.AddScoped<IClinicalService, ClinicalService>();
        services.AddSingleton<ITriageWorkQueue, TriageWorkQueue>();
        services.AddSingleton<SafetyValidationService>();
        var geminiKey = configuration["Gemini:ApiKey"];
        if (!string.IsNullOrWhiteSpace(geminiKey))
        {
            services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
            services.AddHttpClient<IOllamaClient, GeminiClient>(client =>
            {
                client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
            });
        }
        else
        {
            services.Configure<OllamaOptions>(configuration.GetSection(OllamaOptions.SectionName));
            services.AddHttpClient<IOllamaClient, OllamaClient>((provider, client) =>
            {
                var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<OllamaOptions>>().Value;
                client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
            });
        }
        services.AddSingleton<ToolRegistry>();
        services.AddScoped<IToolDispatcher, ToolDispatcher>();
        services.AddScoped<IAgent, ContextAgent>();
        services.AddScoped<IAgent, ExtractionAgent>();
        services.AddScoped<IAgent, AnalysisAgent>();
        services.AddScoped<IAgent, FamilialRiskAgent>();
        services.AddScoped<ITriageOrchestrator, TriageOrchestrator>();
        return services;
    }
}
