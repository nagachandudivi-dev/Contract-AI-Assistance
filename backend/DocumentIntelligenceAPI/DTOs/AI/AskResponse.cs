namespace DocumentIntelligenceAPI.DTOs.AI;

public class AskResponse
{
    public string Answer { get; set; } = string.Empty;
    public string Confidence { get; set; } = "Low";
    public double ConfidenceScore { get; set; }
    public List<CitationDto> Citations { get; set; } = new();
    public int QuestionId { get; set; }
    public int AnswerId { get; set; }
}
