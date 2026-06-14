using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace DocumentIntelligenceAPI.Services;

public class EmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private const string Model = "text-embedding-3-small";

    public bool IsAvailable => !string.IsNullOrEmpty(_apiKey);

    public EmbeddingService(IConfiguration configuration, HttpClient httpClient)
    {
        _httpClient = httpClient;
        _apiKey = configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    }

    public async Task<float[]?> GenerateEmbeddingAsync(string text)
    {
        if (!IsAvailable) return null;

        try
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);

            var payload = new { input = text.Length > 8000 ? text[..8000] : text, model = Model };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.openai.com/v1/embeddings", content);

            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var embedding = doc.RootElement
                .GetProperty("data")[0]
                .GetProperty("embedding")
                .EnumerateArray()
                .Select(e => e.GetSingle())
                .ToArray();

            return embedding;
        }
        catch
        {
            return null;
        }
    }
}
