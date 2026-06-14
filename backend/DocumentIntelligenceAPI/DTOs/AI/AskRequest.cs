using System.ComponentModel.DataAnnotations;

namespace DocumentIntelligenceAPI.DTOs.AI;

public class AskRequest
{
    [Required] public string Question { get; set; } = string.Empty;
}
