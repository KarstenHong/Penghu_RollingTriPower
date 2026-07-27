namespace PenghuSportsFinder.Models;

public static class SportTypes
{
    public static readonly IReadOnlyList<(string Id, string Name, string IconFile)> All = new List<(string, string, string)>
    {
        ("taichi", "太極拳", "taichi.svg"),
        ("folkdance", "土風舞", "folkdance.svg"),
        ("croquet", "槌球", "croquet.svg"),
        ("tabletennis", "桌球", "tabletennis.svg"),
        ("badminton", "羽球", "badminton.svg"),
        ("aerobics", "有氧運動", "aerobics.svg"),
        ("yoga", "瑜珈", "yoga.svg"),
        ("walking", "健走", "walking.svg"),
    };

    public static string NameOf(string id) => All.FirstOrDefault(s => s.Id == id).Name ?? id;
    public static string IconFileOf(string id) => All.FirstOrDefault(s => s.Id == id).IconFile ?? "default.svg";
}
