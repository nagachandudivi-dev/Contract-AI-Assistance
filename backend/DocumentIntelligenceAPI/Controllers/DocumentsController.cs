using DocumentIntelligenceAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentIntelligenceAPI.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly DocumentService _documentService;
    public DocumentsController(DocumentService documentService) => _documentService = documentService;

    [HttpPost("upload")]
    [RequestSizeLimit(52428800)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });
        try
        {
            var doc = await _documentService.UploadAsync(file);
            return Ok(doc);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _documentService.GetAllAsync();
        return Ok(docs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var doc = await _documentService.GetByIdAsync(id);
        return doc == null ? NotFound() : Ok(doc);
    }

    [HttpGet("{id}/chunks")]
    public async Task<IActionResult> GetChunks(int id)
    {
        var chunks = await _documentService.GetChunksAsync(id);
        return Ok(chunks);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _documentService.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}
