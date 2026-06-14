using DocumentIntelligenceAPI.Data;
using DocumentIntelligenceAPI.DTOs.History;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligenceAPI.Services;

public class HistoryService
{
    private readonly AppDbContext _db;
    public HistoryService(AppDbContext db) => _db = db;

    public async Task<List<QuestionHistoryDto>> GetQuestionsAsync()
    {
        return await _db.Questions
            .Include(q => q.Answers)
                .ThenInclude(a => a.Citations)
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => new QuestionHistoryDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                CreatedAt = q.CreatedAt,
                Answers = q.Answers.Select(a => new AnswerHistoryDto
                {
                    Id = a.Id,
                    AnswerText = a.AnswerText,
                    Confidence = a.Confidence,
                    CreatedAt = a.CreatedAt,
                    Citations = a.Citations.Select(c => new CitationHistoryDto
                    {
                        SourceDocument = c.SourceDocument,
                        SectionTitle = c.SectionTitle,
                        PageNumber = c.PageNumber,
                        RowNumber = c.RowNumber
                    }).ToList()
                }).ToList()
            }).ToListAsync();
    }
}
