namespace DocumentIntelligenceAPI.DTOs.Documents;

public class DocumentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalPages { get; set; }
    public string? ErrorMessage { get; set; }
    public int ChunkCount { get; set; }
}
