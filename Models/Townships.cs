namespace PenghuSportsFinder.Models;

public static class Townships
{
    public static readonly IReadOnlyList<(string Id, string Name)> All = new List<(string, string)>
    {
        ("magong", "馬公市"),
        ("huxi", "湖西鄉"),
        ("baisha", "白沙鄉"),
        ("xiyu", "西嶼鄉"),
        ("wangan", "望安鄉"),
        ("qimei", "七美鄉"),
    };

    public static string NameOf(string id) => All.FirstOrDefault(t => t.Id == id).Name ?? id;
}
