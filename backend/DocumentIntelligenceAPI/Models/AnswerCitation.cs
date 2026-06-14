namespace DocumentIntelligenceAPI.Models;

public class AnswerCitation
{
    public int Id { get; set; }
    public int AnswerId { get; set; }
    public int DocumentId { get; set; }
    public int? ChunkId { get; set; }
    public string SourceDocument { get; set; } = string.Empty;
    public string SectionTitle { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int? RowNumber { get; set; }

    public Answer Answer { get; set; } = null!;
    public Document Document { get; set; } = null!;
    public Chunk? Chunk { get; set; }
}
