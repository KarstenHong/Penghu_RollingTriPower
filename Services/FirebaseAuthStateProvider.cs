using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;
using PenghuSportsFinder.Models;

namespace PenghuSportsFinder.Services;

/// <summary>
/// Bridges FirebaseAuthService into Blazor's AuthenticationStateProvider so
/// &lt;AuthorizeView&gt; / [Authorize] work against Firebase Auth + the user's
/// Firestore profile (for the "admin" role used by /admin pages).
/// </summary>
public class FirebaseAuthStateProvider : AuthenticationStateProvider
{
    private readonly FirebaseAuthService _auth;
    private readonly FirestoreService _firestore;
    private bool _initialized;

    public FirebaseAuthStateProvider(FirebaseAuthService auth, FirestoreService firestore)
    {
        _auth = auth;
        _firestore = firestore;
        _auth.AuthStateChanged += () => NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        if (!_initialized)
        {
            await _auth.InitializeAsync();
            _initialized = true;
        }

        var user = _auth.CurrentUser;
        if (user is null)
        {
            return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Uid),
            new(ClaimTypes.Email, user.Email ?? ""),
        };

        var profile = await _firestore.GetByIdAsync<UserProfile>("users", user.Uid);
        if (profile is not null)
        {
            claims.Add(new Claim(ClaimTypes.Name, profile.Name));
            claims.Add(new Claim(ClaimTypes.Role, profile.Role));
        }

        var identity = new ClaimsIdentity(claims, "firebase");
        return new AuthenticationState(new ClaimsPrincipal(identity));
    }
}
