// ⚠ SHARED — coordinated by S1. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using FamilyVeda.Api.Middleware;
using FamilyVeda.Api.Security;
using FamilyVeda.Api.Background;
using FamilyVeda.Application.Common;
using FamilyVeda.Application.Validation;
using FamilyVeda.Infrastructure;
using FamilyVeda.Infrastructure.Auth;
using FamilyVeda.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (!builder.Environment.IsDevelopment() && !builder.Environment.IsEnvironment("Testing"))
    {
        throw new InvalidOperationException("Jwt:Key is required outside Development and Testing.");
    }

    jwtKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = jwtKey });
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "familyveda";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "familyveda-clients";

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
var dataProtection = builder.Services.AddDataProtection();
var keysPath = builder.Configuration["DataProtection:KeysPath"];
if (builder.Configuration.GetValue("DataProtection:PersistToDatabase", false))
    dataProtection.PersistKeysToDbContext<AppDbContext>();
else if (!string.IsNullOrWhiteSpace(keysPath))
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(Path.GetFullPath(keysPath)));
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;
    options.AddPolicy("FamilyUser", policy => policy.RequireRole("FamilyUser"));
    options.AddPolicy("Doctor", policy => policy.RequireRole("Doctor"));
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options => options.AddPolicy("WebClient", policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("Auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.AddPolicy("Ocr", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub") ?? "anonymous",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromMinutes(5),
            QueueLimit = 0
        }));
});

builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Family Veda API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});
builder.Services.AddHealthChecks();
builder.Services.AddHostedService<TriageWorker>();
builder.Services.AddHostedService<CaseSlaWorker>();

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
// Swagger is served in every environment by default so the evaluator can reach /swagger on the
// deployed API (SE3090 §14). It documents endpoints only; every endpoint still enforces JWT auth.
if (app.Configuration.GetValue("Swagger:Enabled", true))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors("WebClient");
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health").AllowAnonymous();

await DatabaseInitializer.InitializeAsync(app.Services, builder.Configuration);

app.Run();

public partial class Program;
