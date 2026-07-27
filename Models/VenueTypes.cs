namespace PenghuSportsFinder.Models;

public static class VenueTypes
{
    public static readonly IReadOnlyList<(string Id, string Name)> All = new List<(string, string)>
    {
        ("community_center", "社區活動中心"),
        ("association", "社區協會"),
        ("health_center", "衛生所"),
    };

    public static string NameOf(string id) => All.FirstOrDefault(t => t.Id == id).Name ?? id;
}
