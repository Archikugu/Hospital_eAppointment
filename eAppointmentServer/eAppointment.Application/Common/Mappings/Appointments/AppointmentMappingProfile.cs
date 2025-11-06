using AutoMapper;
using eAppointment.Application.Features.Appointments.CreateAppointment;
using eAppointment.Application.Features.Appointments.UpdateAppointment;
using eAppointment.Domain.Entities;

namespace eAppointment.Application.Common.Mappings.Appointments;

public sealed class AppointmentMappingProfile : Profile
{
    public AppointmentMappingProfile()
    {
        CreateMap<CreateAppointmentCommand, Appointment>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.IsCompleted, opt => opt.Ignore())
            .ForMember(d => d.IsCancelled, opt => opt.Ignore())
            .ForMember(d => d.Doctor, opt => opt.Ignore())
            .ForMember(d => d.Patient, opt => opt.Ignore());

        CreateMap<UpdateAppointmentCommand, Appointment>()
            .ForMember(d => d.IsCancelled, opt => opt.Ignore())
            .ForMember(d => d.Doctor, opt => opt.Ignore())
            .ForMember(d => d.Patient, opt => opt.Ignore());
    }
}


