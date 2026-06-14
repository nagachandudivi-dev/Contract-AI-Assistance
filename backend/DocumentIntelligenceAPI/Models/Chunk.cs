namespace DocumentIntelligenceAPI.Models;

public class Chunk
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public string ChunkTitle { get; set; } = string.Empty;
    public string ChunkText { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int? RowNumber { get; set; }
    public string? EmbeddingJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Document Document { get; set; } = null!;
    public ICollection<AnswerCitation> AnswerCitations { get; set; } = new List<AnswerCitation>();
}
