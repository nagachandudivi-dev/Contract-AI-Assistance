namespace DocumentIntelligenceAPI.DTOs.AI;

public class CompareResponse
{
    public List<ComparisonField> Fields { get; set; } = new();
    public List<CitationDto> Citations { get; set; } = new();
}

public class ComparisonField
{
    public string FieldName { get; set; } = string.Empty;
    public List<DocumentFieldValue> Values { get; set; } = new();
    public string Difference { get; set; } = string.Empty;
}

public class DocumentFieldValue
{
    public int DocumentId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
