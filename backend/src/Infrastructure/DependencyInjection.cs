// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using FamilyVeda.Application.Auth;
using FamilyVeda.Application.Agents;
using FamilyVeda.Application.Clinical;
using FamilyVeda.Application.Families;
using FamilyVeda.Application.Portal;
using FamilyVeda.Application.Records;
using FamilyVeda.Application.Triage;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Safety;
using FamilyVeda.Infrastructure.Auth;
using FamilyVeda.Infrastructure.Agents;
using FamilyVeda.Infrastructure.Clinical;
using FamilyVeda.Infrastructure.Families;
using FamilyVeda.Infrastructure.Persistence;
using FamilyVeda.Infrastructure.Portal;
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
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorCodesToAdd: null)).UseSnakeCaseNamingConvention());
        services.AddScoped<IPasswordHasher<UserAccount>, PasswordHasher<UserAccount>>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IRegistrationService>(sp => (AuthService)sp.GetRequiredService<IAuthService>());
        services.AddScoped<IFamilyService, FamilyService>();
        services.AddScoped<IFamilyLifecycleService, FamilyLifecycleService>();
        services.AddScoped<IIncomingInvitationService, IncomingInvitationService>();
        services.AddScoped<FamilyVeda.Application.Auth.IProfileService, Auth.ProfileService>();
        services.AddScoped<IFamilyHeadTransferService, FamilyHeadTransferService>();
        services.AddScoped<IRecordService, RecordService>();
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<GoogleDriveOptions>(configuration.GetSection(GoogleDriveOptions.SectionName));
        services.AddSingleton<GoogleDriveSession>();
        services.AddHttpClient<IExternalReportFileStore, GoogleDriveReportFileStore>(client => client.Timeout = TimeSpan.FromSeconds(30));
        services.AddSingleton<IOcrService, TesseractOcrService>();
        services.AddScoped<ILabExtractionService, LabExtractionService>();
        services.AddScoped<ITriageService, TriageService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ICaseSlaProcessor, CaseSlaProcessor>();
        services.AddHttpClient<IPushNotificationClient, FcmPushNotificationClient>(client =>
            client.BaseAddress = new Uri("https://fcm.googleapis.com/"));
        services.AddScoped<IClinicalService, ClinicalService>();
        services.AddScoped<IEmergencyFollowUpService, EmergencyFollowUpService>();
        services.AddSingleton<ITriageWorkQueue, TriageWorkQueue>();
        services.AddSingleton<SafetyValidationService>();
        // Provider chain: Gemini (primary, if configured) -> Groq (openai-compatible,
        // fallback) -> Cloudflare Workers AI (last resort). See ADR-013 and LlmFallbackClient. Each client is registered
        // under its own concrete type; only LlmFallbackClient is exposed as IOllamaClient.
        services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
        services.AddHttpClient<GeminiClient>(client =>
        {
            client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
        services.Configure<LlmOptions>(configuration.GetSection(LlmOptions.SectionName));
        services.AddHttpClient<ChatCompletionsLlmClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<LlmOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
        // [S3] Hosted provider fallback; the endpoint is fixed inside CloudflareClient.
        services.Configure<CloudflareOptions>(configuration.GetSection(CloudflareOptions.SectionName));
        services.AddHttpClient<CloudflareClient>()
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
        services.AddScoped<IOllamaClient, LlmFallbackClient>();
        services.AddSingleton<ToolRegistry>();
        services.AddScoped<IToolDispatcher, ToolDispatcher>();
        services.AddScoped<IAgent, ContextAgent>();
        services.AddScoped<IAgent, ExtractionAgent>();
        services.AddScoped<IAgent, AnalysisAgent>();
        services.AddScoped<IAgent, FamilialRiskAgent>();
        services.AddScoped<ITriageOrchestrator, TriageOrchestrator>();
        services.AddScoped<IJoinRequestService, JoinRequestService>();
        services.AddScoped<IFamilyDoctorService, FamilyDoctorService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IDoctorWorkspaceService, DoctorWorkspaceService>();
        services.AddScoped<IPortalNotificationService, PortalNotificationService>();
        services.AddScoped<IPortalDashboardService, PortalDashboardService>();
        return services;
    }
}
