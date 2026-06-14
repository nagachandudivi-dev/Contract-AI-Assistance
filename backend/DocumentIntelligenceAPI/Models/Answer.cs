namespace DocumentIntelligenceAPI.Models;

public class Answer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string AnswerText { get; set; } = string.Empty;
    public string Confidence { get; set; } = "Low";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Question Question { get; set; } = null!;
    public ICollection<AnswerCitation> Citations { get; set; } = new List<AnswerCitation>();
}
