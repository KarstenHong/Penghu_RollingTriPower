using Microsoft.JSInterop;

namespace PenghuSportsFinder.Services;

public record UserInfo(string Uid, string? Email);

/// <summary>
/// Wraps wwwroot/js/firebase-auth.js. Holds the current signed-in user and raises
/// AuthStateChanged so FirebaseAuthStateProvider can refresh Blazor's auth state.
/// </summary>
public class FirebaseAuthService
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public UserInfo? CurrentUser { get; private set; }
    public event Action? AuthStateChanged;

    public FirebaseAuthService(IJSRuntime js) => _js = js;

    private async Task<IJSObjectReference> ModuleAsync() =>
        _module ??= await _js.InvokeAsync<IJSObjectReference>("import", "./js/firebase-auth.js");

    public async Task InitializeAsync()
    {
        var m = await ModuleAsync();
        CurrentUser = await m.InvokeAsync<UserInfo?>("getCurrentUser");
        AuthStateChanged?.Invoke();
    }

    public async Task<string?> RegisterAsync(string email, string password)
    {
        try
        {
            var m = await ModuleAsync();
            CurrentUser = await m.InvokeAsync<UserInfo?>("registerUser", email, password);
            AuthStateChanged?.Invoke();
            return null;
        }
        catch (JSException ex)
        {
            return ex.Message;
        }
    }

    public async Task<string?> LoginAsync(string email, string password)
    {
        try
        {
            var m = await ModuleAsync();
            CurrentUser = await m.InvokeAsync<UserInfo?>("loginUser", email, password);
            AuthStateChanged?.Invoke();
            return null;
        }
        catch (JSException ex)
        {
            return ex.Message;
        }
    }

    public async Task LogoutAsync()
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("logoutUser");
        CurrentUser = null;
        AuthStateChanged?.Invoke();
    }
}
