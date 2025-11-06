using AutoMapper;
using eAppointment.Application.Features.Patients.CreatePatient;
using eAppointment.Application.Features.Patients.UpdatePatient;
using eAppointment.Domain.Entities;

namespace eAppointment.Application.Common.Mappings.Patients;

public sealed class PatientMappingProfile : Profile
{
	public PatientMappingProfile()
	{
		CreateMap<CreatePatientCommand, Patient>()
			.ForMember(d => d.Id, o => o.Ignore())
			.ForMember(d => d.AppUserId, o => o.Ignore())
			.ForMember(d => d.IsActive, o => o.Ignore())
			.ForMember(d => d.FullName, o => o.Ignore())
			.ForMember(d => d.Appointments, o => o.Ignore())
			.ForMember(d => d.BirthDate, o => o.Ignore());

		CreateMap<UpdatePatientCommand, Patient>()
			.ForMember(d => d.Id, o => o.Ignore())
			.ForMember(d => d.AppUserId, o => o.Ignore())
			.ForMember(d => d.IsActive, o => o.Ignore())
			.ForMember(d => d.FullName, o => o.Ignore())
			.ForMember(d => d.Appointments, o => o.Ignore())
			.ForMember(d => d.BirthDate, o => o.Ignore());
	}
}
