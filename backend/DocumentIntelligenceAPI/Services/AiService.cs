using DocumentIntelligenceAPI.Data;
using DocumentIntelligenceAPI.DTOs.AI;
using DocumentIntelligenceAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace DocumentIntelligenceAPI.Services;

public class AiService
{
    private readonly AppDbContext _db;
    private readonly EmbeddingService _embeddingService;
    private readonly HttpClient _httpClient;
    private readonly ILogger<AiService> _logger;
    private readonly string? _apiKey;
    private const string ChatModel = "gpt-4o-mini";
    private const string NoInfoResponse = "Sorry, I don't have enough information in the uploaded documents to answer this question.";

    public AiService(AppDbContext db, EmbeddingService embeddingService, HttpClient httpClient,
        IConfiguration configuration, ILogger<AiService> logger)
    {
        _db = db;
        _embeddingService = embeddingService;
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");

        if (string.IsNullOrWhiteSpace(_apiKey))
            _logger.LogWarning("OpenAI API key is not configured. AI answers will use keyword fallback only.");
        else
            _logger.LogInformation("OpenAI API key loaded (starts with: {Prefix}...)", _apiKey[..Math.Min(10, _apiKey.Length)]);
    }

    public async Task<AskResponse> AskAsync(string questionText)
    {
        var relevantChunks = await RetrieveRelevantChunksAsync(questionText);

        var question = new Question { QuestionText = questionText, CreatedAt = DateTime.UtcNow };
        _db.Questions.Add(question);
        await _db.SaveChangesAsync();

        if (!relevantChunks.Any())
        {
            var processingCount = await _db.Documents.CountAsync(d => d.Status == "Processing");
            var docCount = await _db.Documents.CountAsync();
            var noInfoMsg = processingCount > 0
                ? "Documents are still being processed. Please wait a moment and try again."
                : docCount == 0
                    ? "No documents have been uploaded yet. Please upload a document first."
                    : NoInfoResponse;

            var emptyAnswer = new Answer
            {
                QuestionId = question.Id,
                AnswerText = noInfoMsg,
                Confidence = "Low",
                CreatedAt = DateTime.UtcNow
            };
            _db.Answers.Add(emptyAnswer);
            await _db.SaveChangesAsync();
            return new AskResponse
            {
                Answer = noInfoMsg, Confidence = "Low", ConfidenceScore = 0,
                QuestionId = question.Id, AnswerId = emptyAnswer.Id
            };
        }

        var (answerText, confidence, score) = await CallGptAsync(questionText, relevantChunks);

        var answer = new Answer
        {
            QuestionId = question.Id,
            AnswerText = answerText,
            Confidence = confidence,
            CreatedAt = DateTime.UtcNow
        };
        _db.Answers.Add(answer);
        await _db.SaveChangesAsync();

        var citations = new List<AnswerCitation>();
        foreach (var chunk in relevantChunks)
        {
            var doc = await _db.Documents.FindAsync(chunk.DocumentId);
            citations.Add(new AnswerCitation
            {
                AnswerId = answer.Id,
                DocumentId = chunk.DocumentId,
                ChunkId = chunk.Id,
                SourceDocument = doc?.OriginalFileName ?? "Unknown",
                SectionTitle = chunk.ChunkTitle,
                PageNumber = chunk.PageNumber,
                RowNumber = chunk.RowNumber
            });
        }
        _db.AnswerCitations.AddRange(citations);
        await _db.SaveChangesAsync();

        return new AskResponse
        {
            Answer = answerText,
            Confidence = confidence,
            ConfidenceScore = score,
            QuestionId = question.Id,
            AnswerId = answer.Id,
            Citations = citations.Select((c, i) => new CitationDto
            {
                DocumentId = c.DocumentId,
                SourceDocument = c.SourceDocument,
                SectionTitle = c.SectionTitle,
                PageNumber = c.PageNumber,
                RowNumber = c.RowNumber,
                ChunkText = relevantChunks[i].ChunkText
            }).ToList()
        };
    }

    public async Task<CompareResponse> CompareAsync(List<int> documentIds, List<string> keywords)
    {
        var documents = await _db.Documents.Where(d => documentIds.Contains(d.Id)).ToListAsync();
        var allChunks = await _db.Chunks.Where(c => documentIds.Contains(c.DocumentId)).ToListAsync();
        var response = new CompareResponse();

        foreach (var keyword in keywords)
        {
            var compField = new ComparisonField { FieldName = keyword };

            foreach (var doc in documents)
            {
                var relevantChunks = allChunks
                    .Where(c => c.DocumentId == doc.Id && c.ChunkText.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                    .Take(2).ToList();

                compField.Values.Add(new DocumentFieldValue
                {
                    DocumentId = doc.Id,
                    DocumentName = doc.OriginalFileName,
                    Value = relevantChunks.Any()
                        ? string.Join(" | ", relevantChunks.Select(c => ExtractFieldValue(c.ChunkText, keyword)))
                        : "Not found"
                });
            }

            var vals = compField.Values.Select(v => v.Value).ToList();
            compField.Difference = vals.All(v => v == "Not found") ? "Not found in either"
                : vals.Distinct().Count() == 1 ? "Values match"
                : "Values differ";

            response.Fields.Add(compField);
        }

        return response;
    }

    private async Task<List<Chunk>> RetrieveRelevantChunksAsync(string question)
    {
        var allChunks = await _db.Chunks.Include(c => c.Document).ToListAsync();
        if (!allChunks.Any()) return new List<Chunk>();

        var scored = new List<(Chunk Chunk, double Score)>();
        var questionEmbedding = await _embeddingService.GenerateEmbeddingAsync(question);

        // Use all words including short ones for names (e.g. "Who is John Lee")
        var questionLower = question.ToLowerInvariant();
        var questionWords = questionLower
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 1)   // include short words and names
            .ToHashSet();

        foreach (var chunk in allChunks)
        {
            double score = 0;
            var chunkLower = chunk.ChunkText.ToLowerInvariant();

            // Keyword score — exact phrase bonus
            if (questionLower.Length > 3 && chunkLower.Contains(questionLower))
                score += 0.8; // direct phrase match gets a big boost

            var keywordMatches = questionWords.Count(w => chunkLower.Contains(w));
            var keywordScore = questionWords.Count > 0 ? (double)keywordMatches / questionWords.Count : 0;
            score += keywordScore * 0.4;

            // Embedding similarity
            if (questionEmbedding != null && !string.IsNullOrEmpty(chunk.EmbeddingJson))
            {
                try
                {
                    var chunkEmbedding = JsonSerializer.Deserialize<float[]>(chunk.EmbeddingJson);
                    if (chunkEmbedding != null)
                        score += CosineSimilarity(questionEmbedding, chunkEmbedding) * 0.6;
                }
                catch { }
            }

            scored.Add((chunk, score));
        }

        var topChunks = scored.OrderByDescending(s => s.Score).Take(5).Select(s => s.Chunk).ToList();
        _logger.LogInformation("Retrieved {Count} chunks for question. Top scores: {Scores}",
            topChunks.Count,
            string.Join(", ", scored.OrderByDescending(s => s.Score).Take(3).Select(s => $"{s.Score:F2}")));

        return topChunks;
    }

    private async Task<(string Answer, string Confidence, double Score)> CallGptAsync(string question, List<Chunk> chunks)
    {
        // Fallback: no API key — extract relevant sentences from chunks directly
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("No OpenAI API key — using keyword fallback for answer.");
            return BuildFallbackAnswer(question, chunks);
        }

        var context = string.Join("\n\n---\n\n", chunks.Select((c, i) =>
            $"[Source {i + 1}: {c.Document?.OriginalFileName ?? "Unknown"}, Section: {c.ChunkTitle}, Page: {c.PageNumber}]\n{c.ChunkText}"));

        var systemPrompt = $"""
            You are a document intelligence assistant. Answer ONLY using the provided document context below.
            Do NOT use any outside knowledge. Do NOT hallucinate or guess.
            Be specific and extract the exact information from the context.
            If the information is not clearly present in the context, respond exactly with:
            "{NoInfoResponse}"

            DOCUMENT CONTEXT:
            {context}
            """;

        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            var payload = new
            {
                model = ChatModel,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = question }
                },
                temperature = 0.1,
                max_tokens = 1000
            };

            var json = JsonSerializer.Serialize(payload);
            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions",
                new StringContent(json, Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("OpenAI API error {Status}: {Body}", (int)response.StatusCode, errorBody);
                // Fall back to keyword answer instead of "Sorry..."
                return BuildFallbackAnswer(question, chunks);
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var answerText = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? NoInfoResponse;

            _logger.LogInformation("OpenAI response received successfully.");
            var score = CalculateConfidenceScore(answerText, chunks);
            var confidence = score >= 0.75 ? "High" : score >= 0.50 ? "Medium" : "Low";
            return (answerText, confidence, score);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI API call failed: {Message}", ex.Message);
            return BuildFallbackAnswer(question, chunks);
        }
    }

    private static (string Answer, string Confidence, double Score) BuildFallbackAnswer(string question, List<Chunk> chunks)
    {
        var words = question.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(w => w.Length > 1).ToHashSet();
        var sentences = chunks.Take(3)
            .SelectMany(c => c.ChunkText.Split(new[] { '.', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            .Select(s => s.Trim())
            .Where(s => s.Length > 20 && words.Any(w => s.ToLowerInvariant().Contains(w)))
            .Distinct().Take(5).ToList();

        if (sentences.Any())
            return (string.Join(". ", sentences) + ".", "Medium", 0.55);

        var top = chunks.First().ChunkText;
        return (top[..Math.Min(600, top.Length)], "Low", 0.3);
    }

    private static double CalculateConfidenceScore(string answer, List<Chunk> chunks)
    {
        if (answer.Contains("don't have enough information", StringComparison.OrdinalIgnoreCase))
            return 0.1;

        var answerWords = answer.ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3).ToHashSet();
        if (!answerWords.Any()) return 0.3;

        var maxMatch = 0.0;
        foreach (var chunk in chunks)
        {
            var chunkWords = chunk.ChunkText.ToLowerInvariant()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length > 3).ToHashSet();
            var intersection = answerWords.Intersect(chunkWords).Count();
            var match = chunkWords.Count > 0
                ? (double)intersection / Math.Min(answerWords.Count, chunkWords.Count) : 0;
            maxMatch = Math.Max(maxMatch, match);
        }
        return Math.Min(maxMatch + 0.2, 1.0);
    }

    private static string ExtractFieldValue(string text, string field)
    {
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            if (line.Contains(field, StringComparison.OrdinalIgnoreCase))
                return line.Trim()[..Math.Min(150, line.Trim().Length)];
        }
        return text[..Math.Min(150, text.Length)];
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length != b.Length) return 0;
        double dot = 0, magA = 0, magB = 0;
        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        var denom = Math.Sqrt(magA) * Math.Sqrt(magB);
        return denom == 0 ? 0 : dot / denom;
    }
}
