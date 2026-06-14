using DocumentIntelligenceAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentIntelligenceAPI.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly HistoryService _historyService;
    public HistoryController(HistoryService historyService) => _historyService = historyService;

    [HttpGet("questions")]
    public async Task<IActionResult> GetQuestions()
    {
        var questions = await _historyService.GetQuestionsAsync();
        return Ok(questions);
    }
}
