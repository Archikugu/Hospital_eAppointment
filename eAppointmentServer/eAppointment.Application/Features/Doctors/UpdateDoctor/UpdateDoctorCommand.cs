using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Doctors.UpdateDoctor;

public sealed record UpdateDoctorCommand(
	Guid Id,
	string FirstName,
	string LastName,
	int DepartmentValue
) : IRequest<Result>;
