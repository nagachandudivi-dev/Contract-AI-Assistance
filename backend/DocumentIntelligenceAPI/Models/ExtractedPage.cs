namespace DocumentIntelligenceAPI.Models;

public class ExtractedPage
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public int PageNumber { get; set; }
    public string Text { get; set; } = string.Empty;
    public int WordCount { get; set; }

    public Document Document { get; set; } = null!;
}
