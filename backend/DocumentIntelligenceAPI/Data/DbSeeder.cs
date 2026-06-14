using DocumentIntelligenceAPI.Models;

namespace DocumentIntelligenceAPI.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (!context.Users.Any())
        {
            context.Users.AddRange(
                new User
                {
                    FullName = "Administrator",
                    Email = "admin@documentai.com",
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    FullName = "Regular User",
                    Email = "user@documentai.com",
                    Username = "user",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"),
                    Role = "User",
                    CreatedAt = DateTime.UtcNow
                }
            );
            context.SaveChanges();
        }
    }
}
