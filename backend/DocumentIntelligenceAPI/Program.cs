using DocumentIntelligenceAPI.Data;
using DocumentIntelligenceAPI.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database
var dbPath = builder.Environment.IsProduction()
    ? "Data Source=/home/documentai.db"
    : "Data Source=documentai.db";

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite(dbPath));

// Services that need HttpClient get registered as typed clients
builder.Services.AddHttpClient<EmbeddingService>();
builder.Services.AddHttpClient<AiService>();

// All other services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DocumentService>();
builder.Services.AddScoped<ExtractionService>();
builder.Services.AddScoped<ChunkingService>();
builder.Services.AddScoped<HistoryService>();
builder.Services.AddScoped<AnalyticsService>();

// CORS — allow frontend to call the API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Contract AI API", Version = "v1" });
});

var app = builder.Build();

// Create database tables and seed default users
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
