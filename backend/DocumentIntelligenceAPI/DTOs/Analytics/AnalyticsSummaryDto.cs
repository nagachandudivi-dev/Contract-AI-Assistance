namespace DocumentIntelligenceAPI.DTOs.Analytics;

public class AnalyticsSummaryDto
{
    public int TotalDocuments { get; set; }
    public int ProcessedDocuments { get; set; }
    public int FailedDocuments { get; set; }
    public int TotalChunks { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalAnswers { get; set; }
    public int DocumentsByType_PDF { get; set; }
    public int DocumentsByType_DOCX { get; set; }
    public int DocumentsByType_CSV { get; set; }
    public List<RecentQuestionDto> RecentQuestions { get; set; } = new();
}

public class RecentQuestionDto
{
    public int Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
