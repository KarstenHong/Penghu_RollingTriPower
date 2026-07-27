using Microsoft.JSInterop;

namespace PenghuSportsFinder.Services;

/// <summary>
/// Generic CRUD over Cloud Firestore via wwwroot/js/firebase-firestore.js.
/// One service handles every collection (venues/courses/posts/faq/associations/users) —
/// no per-collection repository classes needed.
/// </summary>
public class FirestoreService
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public FirestoreService(IJSRuntime js) => _js = js;

    private async Task<IJSObjectReference> ModuleAsync() =>
        _module ??= await _js.InvokeAsync<IJSObjectReference>("import", "./js/firebase-firestore.js");

    public async Task<List<T>> GetAllAsync<T>(string collection)
    {
        var m = await ModuleAsync();
        return await m.InvokeAsync<List<T>>("getAll", collection);
    }

    public async Task<T?> GetByIdAsync<T>(string collection, string id)
    {
        var m = await ModuleAsync();
        return await m.InvokeAsync<T?>("getById", collection, id);
    }

    public async Task<List<T>> GetWhereAsync<T>(string collection, string field, string value)
    {
        var m = await ModuleAsync();
        return await m.InvokeAsync<List<T>>("getWhere", collection, field, value);
    }

    public async Task<string> AddAsync<T>(string collection, T data)
    {
        var m = await ModuleAsync();
        return await m.InvokeAsync<string>("addItem", collection, data);
    }

    public async Task SetAsync<T>(string collection, string id, T data)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("setItem", collection, id, data);
    }

    public async Task DeleteAsync(string collection, string id)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("deleteItem", collection, id);
    }
}
