using System.Text.Json.Serialization;

namespace PenghuSportsFinder.Models;

public class Association
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("township")]
    public string Township { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = "";

    [JsonPropertyName("address")]
    public string Address { get; set; } = "";
}
