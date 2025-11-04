using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace eAppointment.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // MediatR
        services.AddMediatR(configuration =>
        {
            configuration.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
        });

        // AutoMapper - Manuel yapılandırma (AutoMapper.Extensions paketi olmadan)
        // AutoMapper 15.0+ sürümünde ILoggerFactory parametresi gerekiyor
        var mapperConfiguration = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(typeof(DependencyInjection).Assembly);
        }, NullLoggerFactory.Instance);
        
        mapperConfiguration.AssertConfigurationIsValid();
        
        services.AddSingleton<IMapper>(mapperConfiguration.CreateMapper());

        return services;
    }
}

