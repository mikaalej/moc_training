using Microsoft.EntityFrameworkCore;
using Moc.Api.Middleware;
using Moc.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: allow React frontend (Vite dev server) to call the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<MocDbContext>();

// Configure DbContext with SQL Server connection string from configuration.
// Suppress PendingModelChangesWarning so startup succeeds when snapshot has minor drift; add a migration when you change the model.
builder.Services.AddDbContext<MocDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("MocDatabase"));
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Register the database initializer as a scoped service
builder.Services.AddScoped<MocDbInitializer>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add global error handling middleware (must be early in pipeline)
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapHealthChecks("/health");

// Initialize database on startup (runs migrations and seeds demo data in Development)
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<MocDbInitializer>();
    await initializer.InitializeAsync();
}

app.Run();
