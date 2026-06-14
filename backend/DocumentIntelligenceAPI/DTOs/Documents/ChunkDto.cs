namespace DocumentIntelligenceAPI.DTOs.Documents;

public class ChunkDto
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public string ChunkTitle { get; set; } = string.Empty;
    public string ChunkText { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int? RowNumber { get; set; }
    public bool HasEmbedding { get; set; }
    public DateTime CreatedAt { get; set; }
}
