namespace DocumentIntelligenceAPI.Services;

public class ChunkData
{
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public int? RowNumber { get; set; }
}

public class ChunkingService
{
    public List<ChunkData> Chunk(List<PageContent> pages, string fileType)
    {
        if (fileType.ToUpperInvariant() == "CSV")
        {
            var chunks = new List<ChunkData>();
            const int batchSize = 20;
            for (var i = 0; i < pages.Count; i += batchSize)
            {
                var batch = pages.Skip(i).Take(batchSize).ToList();
                chunks.Add(new ChunkData
                {
                    Title = $"Rows {batch.First().RowNumber} - {batch.First().RowNumber + batch.Count - 1}",
                    Text = string.Join("\n", batch.Select(p => p.Text)),
                    PageNumber = batch.First().PageNumber,
                    RowNumber = batch.First().RowNumber
                });
            }
            return chunks;
        }

        var result = new List<ChunkData>();
        foreach (var page in pages.Where(p => !string.IsNullOrWhiteSpace(p.Text)))
        {
            var words = page.Text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            const int size = 500;
            for (var i = 0; i < words.Length; i += size)
                result.Add(new ChunkData
                {
                    Title = $"Page {page.PageNumber}, Part {i / size + 1}",
                    Text = string.Join(" ", words.Skip(i).Take(size)),
                    PageNumber = page.PageNumber
                });
        }
        return result;
    }
}
