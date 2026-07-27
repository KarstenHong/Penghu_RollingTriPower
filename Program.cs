using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using PenghuSportsFinder;
using PenghuSportsFinder.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<FirebaseAuthService>();
builder.Services.AddScoped<FirestoreService>();
builder.Services.AddScoped<AuthenticationStateProvider, FirebaseAuthStateProvider>();

await builder.Build().RunAsync();
