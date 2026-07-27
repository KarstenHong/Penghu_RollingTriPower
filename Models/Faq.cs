using System.Text.Json.Serialization;

namespace PenghuSportsFinder.Models;

public class Faq
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("question")]
    public string Question { get; set; } = "";

    [JsonPropertyName("answer")]
    public string Answer { get; set; } = "";
}
