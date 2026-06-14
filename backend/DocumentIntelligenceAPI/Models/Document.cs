namespace DocumentIntelligenceAPI.Models;

public class Document
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Processing";
    public int TotalPages { get; set; }
    public string? ErrorMessage { get; set; }

    public ICollection<ExtractedPage> ExtractedPages { get; set; } = new List<ExtractedPage>();
    public ICollection<Chunk> Chunks { get; set; } = new List<Chunk>();
    public ICollection<AnswerCitation> AnswerCitations { get; set; } = new List<AnswerCitation>();
}
