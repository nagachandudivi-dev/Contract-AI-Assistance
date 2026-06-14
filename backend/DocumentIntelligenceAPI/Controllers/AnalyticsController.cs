using DocumentIntelligenceAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace DocumentIntelligenceAPI.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly AnalyticsService _analyticsService;
    public AnalyticsController(AnalyticsService analyticsService) => _analyticsService = analyticsService;

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _analyticsService.GetSummaryAsync();
        return Ok(summary);
    }
}
