using System.ComponentModel.DataAnnotations;

namespace DocumentIntelligenceAPI.DTOs.Auth;

public class RegisterRequest
{
    [Required] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Username { get; set; } = string.Empty;
    [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
    [Required] public string Role { get; set; } = "User";
}
