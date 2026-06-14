using DocumentIntelligenceAPI.Data;
using DocumentIntelligenceAPI.DTOs.Documents;
using DocumentIntelligenceAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DocumentIntelligenceAPI.Services;

public class DocumentService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<DocumentService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    private static readonly string[] AllowedTypes = { ".pdf", ".docx", ".csv" };
    private const long MaxFileSize = 50 * 1024 * 1024;

    public DocumentService(
        AppDbContext db,
        IWebHostEnvironment env,
        ILogger<DocumentService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _env = env;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task<DocumentDto> UploadAsync(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedTypes.Contains(extension))
            throw new InvalidOperationException($"File type '{extension}' is not allowed. Allowed: .pdf, .docx, .csv");

        if (file.Length > MaxFileSize)
            throw new InvalidOperationException("File size exceeds the 50 MB limit.");

        await ValidateFileContentAsync(file, extension);

        var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads", "documents");
        Directory.CreateDirectory(uploadsPath);

        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, safeFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var fileType = extension.TrimStart('.').ToUpperInvariant();
        var document = new Document
        {
            Name = Path.GetFileNameWithoutExtension(file.FileName),
            FileType = fileType,
            OriginalFileName = file.FileName,
            StoredFileName = safeFileName,
            FilePath = filePath,
            UploadDate = DateTime.UtcNow,
            Status = "Processing"
        };
        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        // Fire and forget — uses its own scope so the disposed HTTP context doesn't matter
        _ = Task.Run(() => ProcessDocumentAsync(document.Id, filePath, fileType));

        return MapToDto(document, 0);
    }

    private async Task ProcessDocumentAsync(int documentId, string filePath, string fileType)
    {
        // Create a brand-new DI scope so all services are fresh and independent
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var extractionService = scope.ServiceProvider.GetRequiredService<ExtractionService>();
        var chunkingService = scope.ServiceProvider.GetRequiredService<ChunkingService>();
        var embeddingService = scope.ServiceProvider.GetRequiredService<EmbeddingService>();

        try
        {
            var extraction = await extractionService.ExtractAsync(filePath, fileType);
            var document = await db.Documents.FindAsync(documentId);
            if (document == null) return;

            document.TotalPages = extraction.TotalPages;

            var pages = extraction.Pages.Select(p => new ExtractedPage
            {
                DocumentId = documentId,
                PageNumber = p.PageNumber,
                Text = p.Text,
                WordCount = p.Text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length
            }).ToList();
            db.ExtractedPages.AddRange(pages);

            var chunkDataList = chunkingService.Chunk(extraction.Pages, fileType);
            foreach (var chunkData in chunkDataList)
            {
                var embedding = await embeddingService.GenerateEmbeddingAsync(chunkData.Text);
                db.Chunks.Add(new Chunk
                {
                    DocumentId = documentId,
                    ChunkTitle = chunkData.Title,
                    ChunkText = chunkData.Text,
                    PageNumber = chunkData.PageNumber,
                    RowNumber = chunkData.RowNumber,
                    EmbeddingJson = embedding != null ? JsonSerializer.Serialize(embedding) : null,
                    CreatedAt = DateTime.UtcNow
                });
            }

            document.Status = "Ready";
            await db.SaveChangesAsync();
            _logger.LogInformation("Document {DocumentId} processed successfully with {ChunkCount} chunks.", documentId, chunkDataList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing document {DocumentId}: {Message}", documentId, ex.Message);
            try
            {
                using var errorScope = _scopeFactory.CreateScope();
                var errorDb = errorScope.ServiceProvider.GetRequiredService<AppDbContext>();
                var doc = await errorDb.Documents.FindAsync(documentId);
                if (doc != null)
                {
                    doc.Status = "Failed";
                    doc.ErrorMessage = ex.Message;
                    await errorDb.SaveChangesAsync();
                }
            }
            catch (Exception innerEx)
            {
                _logger.LogError(innerEx, "Failed to update error status for document {DocumentId}", documentId);
            }
        }
    }

    public async Task<List<DocumentDto>> GetAllAsync()
    {
        var docs = await _db.Documents
            .Include(d => d.Chunks)
            .OrderByDescending(d => d.UploadDate)
            .ToListAsync();
        return docs.Select(d => MapToDto(d, d.Chunks.Count)).ToList();
    }

    public async Task<DocumentDto?> GetByIdAsync(int id)
    {
        var doc = await _db.Documents.Include(d => d.Chunks).FirstOrDefaultAsync(d => d.Id == id);
        return doc == null ? null : MapToDto(doc, doc.Chunks.Count);
    }

    public async Task<List<ChunkDto>> GetChunksAsync(int id)
    {
        return await _db.Chunks
            .Where(c => c.DocumentId == id)
            .OrderBy(c => c.PageNumber)
            .Select(c => new ChunkDto
            {
                Id = c.Id,
                DocumentId = c.DocumentId,
                ChunkTitle = c.ChunkTitle,
                ChunkText = c.ChunkText,
                PageNumber = c.PageNumber,
                RowNumber = c.RowNumber,
                HasEmbedding = c.EmbeddingJson != null,
                CreatedAt = c.CreatedAt
            }).ToListAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc == null) return false;

        // Delete AnswerCitations referencing this document first (FK is NoAction, not Cascade)
        var citations = await _db.AnswerCitations.Where(ac => ac.DocumentId == id).ToListAsync();
        _db.AnswerCitations.RemoveRange(citations);

        // Delete Chunks and ExtractedPages explicitly to be safe
        var chunks = await _db.Chunks.Where(c => c.DocumentId == id).ToListAsync();
        _db.Chunks.RemoveRange(chunks);

        var pages = await _db.ExtractedPages.Where(p => p.DocumentId == id).ToListAsync();
        _db.ExtractedPages.RemoveRange(pages);

        if (File.Exists(doc.FilePath))
            File.Delete(doc.FilePath);

        _db.Documents.Remove(doc);
        await _db.SaveChangesAsync();
        return true;
    }

    private static async Task ValidateFileContentAsync(IFormFile file, string extension)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var bytes = ms.ToArray();

        switch (extension)
        {
            case ".pdf":
                if (bytes.Length < 4 || bytes[0] != 0x25 || bytes[1] != 0x50 || bytes[2] != 0x44 || bytes[3] != 0x46)
                    throw new InvalidOperationException("Invalid PDF file.");
                break;
            case ".docx":
                if (bytes.Length < 4 || bytes[0] != 0x50 || bytes[1] != 0x4B)
                    throw new InvalidOperationException("Invalid DOCX file.");
                break;
        }
    }

    private static DocumentDto MapToDto(Document d, int chunkCount) => new()
    {
        Id = d.Id,
        Name = d.Name,
        FileType = d.FileType,
        OriginalFileName = d.OriginalFileName,
        UploadDate = d.UploadDate,
        Status = d.Status,
        TotalPages = d.TotalPages,
        ErrorMessage = d.ErrorMessage,
        ChunkCount = chunkCount
    };
}
