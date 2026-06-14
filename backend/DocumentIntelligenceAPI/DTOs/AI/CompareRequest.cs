using System.ComponentModel.DataAnnotations;

namespace DocumentIntelligenceAPI.DTOs.AI;

public class CompareRequest
{
    [Required] public List<int> DocumentIds { get; set; } = new();
    [Required] public List<string> Keywords { get; set; } = new();
}
