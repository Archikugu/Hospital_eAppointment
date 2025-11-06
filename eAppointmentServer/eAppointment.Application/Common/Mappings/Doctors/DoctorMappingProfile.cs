using AutoMapper;
using eAppointment.Application.Features.Doctors.CreateDoctor;
using eAppointment.Application.Features.Doctors.UpdateDoctor;
using eAppointment.Domain.Entities;

namespace eAppointment.Application.Common.Mappings.Doctors;

public class DoctorMappingProfile : Profile
{
	public DoctorMappingProfile()
	{
		// CreateDoctorCommand -> Doctor
		CreateMap<CreateDoctorCommand, Doctor>()
			.ForMember(dest => dest.Id, opt => opt.Ignore())
			.ForMember(dest => dest.AppUserId, opt => opt.Ignore())
			.ForMember(dest => dest.IsActive, opt => opt.Ignore())
			.ForMember(dest => dest.FullName, opt => opt.Ignore()) // Computed property
			.ForMember(dest => dest.Department, opt => opt.Ignore()) // Will be set manually after validation
			.ForMember(dest => dest.Appointments, opt => opt.Ignore());

		// UpdateDoctorCommand -> Doctor (map scalar props onto existing entity)
		CreateMap<UpdateDoctorCommand, Doctor>()
			.ForMember(dest => dest.Id, opt => opt.Ignore())
			.ForMember(dest => dest.AppUserId, opt => opt.Ignore())
			.ForMember(dest => dest.IsActive, opt => opt.Ignore())
			.ForMember(dest => dest.FullName, opt => opt.Ignore())
			.ForMember(dest => dest.Department, opt => opt.Ignore())
			.ForMember(dest => dest.Appointments, opt => opt.Ignore());
	}
}

