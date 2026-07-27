using System.Text.Json.Serialization;

namespace PenghuSportsFinder.Models;

public class Course
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("venueId")]
    public string VenueId { get; set; } = "";

    [JsonPropertyName("sportType")]
    public string SportType { get; set; } = "";

    [JsonPropertyName("schedule")]
    public string Schedule { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("iconKey")]
    public string IconKey { get; set; } = "";
}
