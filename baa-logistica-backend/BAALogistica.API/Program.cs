using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var cultureInfo = new CultureInfo("en-US");
CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

// Add services to the container.
builder.Services.AddControllers();

// Configurar SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ✅ Configurar JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ChaveSecretaSuperSegura123!@#MinhaAPIBAALogistica2024";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BAALogisticaAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BAALogisticaApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

var supportedCultures = new[] { cultureInfo };
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture(cultureInfo),
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures
});

// Criar banco de dados e aplicar migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();

    var connection = dbContext.Database.GetDbConnection();
    connection.Open();
    try
    {
        using var pragmaCommand = connection.CreateCommand();
        pragmaCommand.CommandText = "PRAGMA table_info(Usuarios);";
        using var reader = pragmaCommand.ExecuteReader();

        var hasAvatarColumn = false;
        while (reader.Read())
        {
            var columnName = reader.GetString(1);
            if (string.Equals(columnName, "AvatarBase64", StringComparison.OrdinalIgnoreCase))
            {
                hasAvatarColumn = true;
                break;
            }
        }

        if (!hasAvatarColumn)
        {
            using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText = "ALTER TABLE Usuarios ADD COLUMN AvatarBase64 TEXT";
            alterCommand.ExecuteNonQuery();
        }
    }
    finally
    {
        connection.Close();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// ✅ Authentication e Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();