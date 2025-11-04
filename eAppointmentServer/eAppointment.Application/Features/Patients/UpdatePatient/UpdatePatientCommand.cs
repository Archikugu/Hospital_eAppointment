using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Patients.UpdatePatient;

public sealed record UpdatePatientCommand(
	Guid Id,
	string FirstName,
	string LastName,
	string IdentityNumber,
	string? City,
	string? District,
	string? FullAddress,
	string? BirthDate,
	string? Gender
) : IRequest<Result>;
