using DocumentIntelligenceAPI.Data;
using DocumentIntelligenceAPI.DTOs.Analytics;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligenceAPI.Services;

public class AnalyticsService
{
    private readonly AppDbContext _db;
    public AnalyticsService(AppDbContext db) => _db = db;

    public async Task<AnalyticsSummaryDto> GetSummaryAsync()
    {
        var documents = await _db.Documents.ToListAsync();
        var recentQuestions = await _db.Questions
            .OrderByDescending(q => q.CreatedAt)
            .Take(5)
            .ToListAsync();

        return new AnalyticsSummaryDto
        {
            TotalDocuments = documents.Count,
            ProcessedDocuments = documents.Count(d => d.Status == "Ready"),
            FailedDocuments = documents.Count(d => d.Status == "Failed"),
            TotalChunks = await _db.Chunks.CountAsync(),
            TotalQuestions = await _db.Questions.CountAsync(),
            TotalAnswers = await _db.Answers.CountAsync(),
            DocumentsByType_PDF = documents.Count(d => d.FileType == "PDF"),
            DocumentsByType_DOCX = documents.Count(d => d.FileType == "DOCX"),
            DocumentsByType_CSV = documents.Count(d => d.FileType == "CSV"),
            RecentQuestions = recentQuestions.Select(q => new RecentQuestionDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                CreatedAt = q.CreatedAt
            }).ToList()
        };
    }
}
