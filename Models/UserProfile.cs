using System.Text.Json.Serialization;

namespace PenghuSportsFinder.Models;

public class UserProfile
{
    [JsonPropertyName("uid")]
    public string? Uid { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("birthDate")]
    public string BirthDate { get; set; } = ""; // ISO yyyy-MM-dd

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = "";

    [JsonPropertyName("township")]
    public string Township { get; set; } = "";

    [JsonPropertyName("favoriteSports")]
    public List<string> FavoriteSports { get; set; } = new();

    [JsonPropertyName("favoriteVenueIds")]
    public List<string> FavoriteVenueIds { get; set; } = new();

    [JsonPropertyName("role")]
    public string Role { get; set; } = "user"; // "user" or "admin"
}
