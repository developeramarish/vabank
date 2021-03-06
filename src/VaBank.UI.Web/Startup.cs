﻿using System.Collections.Generic;
using System.Configuration;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Web.Hosting;
using System.Web.Http;
using Autofac;
using Hangfire;
using Hangfire.Dashboard;
using Hangfire.SqlServer;
using Microsoft.Owin.Cors;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using NLog;
using Owin;
using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using SquishIt.Framework;
using SquishIt.Sass;
using VaBank.Common.Data;
using VaBank.Common.Resources;
using VaBank.Jobs;
using VaBank.Jobs.Modules;
using VaBank.UI.Web.Api.Infrastructure.Auth;
using VaBank.UI.Web.Api.Infrastructure.Converters;
using VaBank.UI.Web.Api.Infrastructure.Filters;
using VaBank.UI.Web.Api.Infrastructure.ModelBinding;
using VaBank.UI.Web.Middleware;
using VaBank.UI.Web.Modules;
using VaBank.UI.Web.Views;
using VaBank.UI.Web.Api.Infrastructure.MessageHandlers;
using System.Web.Http.ExceptionHandling;

namespace VaBank.UI.Web
{    
    public class Startup
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();

        private const string EveryTenMinutes = "*/10 * * * *";

        public void Configuration(IAppBuilder config)
        {
            Bundle.RegisterStylePreprocessor(new SassPreprocessor());
            var httpConfig = ConfigureWebApi();

            config.Use<ExceptionMiddleware>();
            config.Use<CultureMiddleware>();
            #if (!DEBUG)
            config.Use<RedirectToHttpsMiddleware>();
            #endif
            config.UseAutofacMiddleware(ConfigureAutofac(httpConfig));

            config.UseStaticFiles("/Client");

            config.UseCors(CorsOptions.AllowAll);
            config.UseCookieAuthentication(new CookieAuthenticationOptions()
            {
                CookiePath = "/admin/hangfire",
                ExpireTimeSpan = TimeSpan.FromMinutes(15)
            });
            config.UseOAuthAuthorizationServer(ConfigureOAuthServer());
            config.UseOAuthBearerAuthentication(new OAuthBearerAuthenticationOptions());

            JobStartup jobStartup = null;
            config.UseHangfire(hangfireConfig =>
            {
                var module = ConfigureHangfire(hangfireConfig);
                jobStartup = module.Resolve<JobStartup>();
            });          
            config.UseWebApi(httpConfig);
            config.UseAutofacWebApi(httpConfig);
            
            config.Use(Handler);

            _logger.Info("Application is started!");
                        
            jobStartup.Start();
        }

        public Task Handler(IOwinContext context, Func<Task> next)
        {
            var response = context.Response;
            var template = new Index();
            return response.WriteAsync(template.TransformText());
        }

        private OAuthAuthorizationServerOptions ConfigureOAuthServer()
        {
            return new OAuthAuthorizationServerOptions
            {
#if DEBUG
                AllowInsecureHttp = true,
#endif
                RefreshTokenProvider = new VabankRefreshTokenProvider(),
                Provider = new VabankAuthorizationServerProvider(),
                TokenEndpointPath = new PathString("/api/token"),
                AccessTokenExpireTimeSpan = TimeSpan.FromMinutes(10)
            };
        }

        private static ILifetimeScope ConfigureHangfire(IBootstrapperConfiguration config)
        {
            var connectionString = ConfigurationManager.ConnectionStrings["Vabank.Db"].ConnectionString;
            config.UseDashboardPath("/admin/hangfire");
            var storageOptions = new SqlServerStorageOptions {QueuePollInterval = TimeSpan.FromSeconds(15)};
            config.UseStorage(new SqlServerStorage(connectionString, storageOptions));
            config.UseAuthorizationFilters(new AuthorizationFilter {Roles = "Admin"});
            var builder = new ContainerBuilder();
            builder.RegisterModule(new BackgroundServicesModule(VaBankServiceBus.Instance));
            var module = builder.Build(); 
            config.UseAutofacActivator(module);
            config.UseServer();
            return module;
        }

        private static HttpConfiguration ConfigureWebApi()
        {
            var configuration = new HttpConfiguration();
            configuration.MapHttpAttributeRoutes();

            //Authentication
            configuration.SuppressDefaultHostAuthentication();
            configuration.Filters.Add(new HostAuthenticationFilter("Bearer"));

            //Filters
            configuration.Filters.Add(new ServiceExceptionFilterAttribute());
            configuration.Filters.Add(new ServiceOperationAttribute());

            //Formatters and converters
            configuration.Formatters.Clear();
            var jsonFormatter = new JsonMediaTypeFormatter();
            jsonFormatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/octet-stream"));
            var serializerSettings = new Newtonsoft.Json.JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
            };
            serializerSettings.Converters.Insert(0, new StringEnumConverter());
            serializerSettings.Converters.Insert(1, new LinkJsonConverter(
                new CompositeUriProvider(new List<IUriProvider> { new WebServerUriProvider(string.Empty) })));
            serializerSettings.Converters.Insert(2, new HttpServiceErrorConverter());
            serializerSettings.Converters.Insert(3, new PagedListConverter());
            jsonFormatter.SerializerSettings = serializerSettings;
            configuration.Formatters.Add(jsonFormatter);

            //Binding rules
            configuration.ParameterBindingRules.Insert(0, x => 
                typeof(IClientQuery).IsAssignableFrom(x.ParameterType) 
                ? new QueryHttpParameterBinding(x) 
                : null);


            configuration.Services.Add(typeof(IExceptionLogger), new GlobalExceptionLogger());

            configuration.EnsureInitialized();
            return configuration;
        }

        private static ILifetimeScope ConfigureAutofac(HttpConfiguration httpConfig)
        {
            var builder = new ContainerBuilder();
            builder.RegisterModule(new WebApiModule(httpConfig));
            var container = builder.Build();
            return container;
        }
    }
}