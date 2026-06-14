using UglyToad.PdfPig;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.Text;

namespace DocumentIntelligenceAPI.Services;

public class ExtractionResult
{
    public List<PageContent> Pages { get; set; } = new();
    public int TotalPages { get; set; }
}

public class PageContent
{
    public int PageNumber { get; set; }
    public string Text { get; set; } = string.Empty;
    public int? RowNumber { get; set; }
}

public class ExtractionService
{
    public async Task<ExtractionResult> ExtractAsync(string filePath, string fileType)
    {
        return fileType.ToUpperInvariant() switch
        {
            "PDF" => await Task.Run(() => ExtractPdf(filePath)),
            "DOCX" => await Task.Run(() => ExtractDocx(filePath)),
            "CSV" => await Task.Run(() => ExtractCsv(filePath)),
            _ => throw new NotSupportedException($"File type '{fileType}' is not supported.")
        };
    }

    private static ExtractionResult ExtractPdf(string filePath)
    {
        var result = new ExtractionResult();
        using var pdf = PdfDocument.Open(filePath);
        result.TotalPages = pdf.NumberOfPages;
        foreach (var page in pdf.GetPages())
        {
            var words = page.GetWords();
            var text = string.Join(" ", words.Select(w => w.Text));
            result.Pages.Add(new PageContent
            {
                PageNumber = page.Number,
                Text = text.Trim()
            });
        }
        return result;
    }

    private static ExtractionResult ExtractDocx(string filePath)
    {
        var result = new ExtractionResult();
        using var doc = WordprocessingDocument.Open(filePath, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body == null) return result;

        var paragraphs = body.Descendants<Paragraph>().ToList();
        var pageSize = 30;
        var page = 1;
        var sb = new StringBuilder();
        var count = 0;

        foreach (var para in paragraphs)
        {
            var text = para.InnerText.Trim();
            if (string.IsNullOrEmpty(text)) continue;
            sb.AppendLine(text);
            count++;
            if (count >= pageSize)
            {
                result.Pages.Add(new PageContent { PageNumber = page++, Text = sb.ToString().Trim() });
                sb.Clear();
                count = 0;
            }
        }

        if (sb.Length > 0)
            result.Pages.Add(new PageContent { PageNumber = page, Text = sb.ToString().Trim() });

        result.TotalPages = result.Pages.Count;
        return result;
    }

    private static ExtractionResult ExtractCsv(string filePath)
    {
        var result = new ExtractionResult();
        var config = new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true, MissingFieldFound = null };
        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, config);

        var records = csv.GetRecords<dynamic>().ToList();
        result.TotalPages = records.Count;

        for (var i = 0; i < records.Count; i++)
        {
            var row = (IDictionary<string, object>)records[i];
            var text = string.Join(", ", row.Select(kv => $"{kv.Key}: {kv.Value}"));
            result.Pages.Add(new PageContent
            {
                PageNumber = i + 1,
                Text = text,
                RowNumber = i + 1
            });
        }

        return result;
    }
}
