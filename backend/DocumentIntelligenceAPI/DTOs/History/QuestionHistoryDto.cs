namespace DocumentIntelligenceAPI.DTOs.History;

public class QuestionHistoryDto
{
    public int Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<AnswerHistoryDto> Answers { get; set; } = new();
}

public class AnswerHistoryDto
{
    public int Id { get; set; }
    public string AnswerText { get; set; } = string.Empty;
    public string Confidence { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<CitationHistoryDto> Citations { get; set; } = new();
}

public class CitationHistoryDto
{
    public string SourceDocument { get; set; } = string.Empty;
    public string SectionTitle { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int? RowNumber { get; set; }
}
