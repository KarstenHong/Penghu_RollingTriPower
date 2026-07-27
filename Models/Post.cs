using System.Text.Json.Serialization;

namespace PenghuSportsFinder.Models;

public class Post
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = "news"; // "news" or "event"

    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("content")]
    public string Content { get; set; } = "";

    [JsonPropertyName("date")]
    public string Date { get; set; } = ""; // ISO yyyy-MM-dd, kept as string for simple Firestore round-trip

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = "";
}
