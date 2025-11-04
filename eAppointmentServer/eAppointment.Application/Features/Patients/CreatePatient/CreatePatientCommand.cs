using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using MediatR;

namespace eAppointment.Application.Features.Patients.CreatePatient;

public sealed record CreatePatientCommand(
	string FirstName,
	string LastName,
	string IdentityNumber,
	string? City,
	string? District,
	string? FullAddress,
	string? BirthDate,
	string? Gender
) : IRequest<Result<Patient>>;
