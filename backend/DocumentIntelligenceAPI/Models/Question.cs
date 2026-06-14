namespace DocumentIntelligenceAPI.Models;

public class Question
{
    public int Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
