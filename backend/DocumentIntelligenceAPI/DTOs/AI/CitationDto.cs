namespace DocumentIntelligenceAPI.DTOs.AI;

public class CitationDto
{
    public int DocumentId { get; set; }
    public string SourceDocument { get; set; } = string.Empty;
    public string SectionTitle { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int? RowNumber { get; set; }
    public string ChunkText { get; set; } = string.Empty;
}
