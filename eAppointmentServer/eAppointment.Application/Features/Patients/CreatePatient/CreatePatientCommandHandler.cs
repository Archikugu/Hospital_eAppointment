using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;
using AutoMapper;

namespace eAppointment.Application.Features.Patients.CreatePatient;

internal sealed class CreatePatientCommandHandler(
	IPatientRepository patientRepository,
	IUnitOfWork unitOfWork,
	IMapper mapper
) : IRequestHandler<CreatePatientCommand, Result<Patient>>
{
	public async Task<Result<Patient>> Handle(CreatePatientCommand request, CancellationToken cancellationToken)
	{
		if (string.IsNullOrWhiteSpace(request.FirstName))
			return Result.Failure<Patient>(Error.Validation("First name is required."));

		if (string.IsNullOrWhiteSpace(request.LastName))
			return Result.Failure<Patient>(Error.Validation("Last name is required."));

		if (string.IsNullOrWhiteSpace(request.IdentityNumber))
			return Result.Failure<Patient>(Error.Validation("Identity number is required."));

		if (request.IdentityNumber.Length != 11)
			return Result.Failure<Patient>(Error.Validation("Identity number must be 11 characters."));

		var exists = await patientRepository.ExistsByIdentityNumberAsync(request.IdentityNumber, cancellationToken).ConfigureAwait(false);
		if (exists)
			return Result.Failure<Patient>(Error.Conflict($"Patient with identity '{request.IdentityNumber}' already exists."));

		// Map using AutoMapper
		var entity = mapper.Map<Patient>(request);
		// Normalize strings
		entity.FirstName = entity.FirstName.Trim();
		entity.LastName = entity.LastName.Trim();
		entity.IdentityNumber = entity.IdentityNumber.Trim();
		entity.City = (entity.City ?? string.Empty).Trim();
		entity.District = (entity.District ?? string.Empty).Trim();
		entity.FullAddress = (entity.FullAddress ?? string.Empty).Trim();
		entity.Gender = (request.Gender ?? string.Empty).Trim();

		// Parse BirthDate (yyyy-MM-dd)
		if (!string.IsNullOrWhiteSpace(request.BirthDate) && DateOnly.TryParse(request.BirthDate, out var date))
		{
			entity.BirthDate = date;
		}
		else
		{
			entity.BirthDate = null;
		}

		await patientRepository.AddAsync(entity, cancellationToken).ConfigureAwait(false);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

		return Result.Success(entity);
	}
}
