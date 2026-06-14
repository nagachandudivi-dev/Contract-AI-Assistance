using DocumentIntelligenceAPI.DTOs.AI;
using DocumentIntelligenceAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentIntelligenceAPI.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly AiService _aiService;
    public AiController(AiService aiService) => _aiService = aiService;

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(new { message = "Question cannot be empty." });
        var response = await _aiService.AskAsync(request.Question);
        return Ok(response);
    }

    [HttpPost("compare")]
    public async Task<IActionResult> Compare([FromBody] CompareRequest request)
    {
        if (request.DocumentIds == null || request.DocumentIds.Count < 2)
            return BadRequest(new { message = "Please select at least 2 documents to compare." });
        if (request.Keywords == null || request.Keywords.Count == 0)
            return BadRequest(new { message = "Please enter at least one keyword to compare." });
        var response = await _aiService.CompareAsync(request.DocumentIds, request.Keywords);
        return Ok(response);
    }
}
