using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;
using AutoMapper;

namespace eAppointment.Application.Features.Patients.UpdatePatient;

internal sealed class UpdatePatientCommandHandler(
	IPatientRepository patientRepository,
	IUnitOfWork unitOfWork,
	IMapper mapper
) : IRequestHandler<UpdatePatientCommand, Result>
{
	public async Task<Result> Handle(UpdatePatientCommand request, CancellationToken cancellationToken)
	{
		if (request.Id == Guid.Empty)
			return Result.Failure(Error.Validation("Invalid patient id."));

		if (string.IsNullOrWhiteSpace(request.FirstName))
			return Result.Failure(Error.Validation("First name is required."));

		if (string.IsNullOrWhiteSpace(request.LastName))
			return Result.Failure(Error.Validation("Last name is required."));

		if (string.IsNullOrWhiteSpace(request.IdentityNumber))
			return Result.Failure(Error.Validation("Identity number is required."));

		if (request.IdentityNumber.Length != 11)
			return Result.Failure(Error.Validation("Identity number must be 11 characters."));

		var entity = await patientRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
		if (entity is null)
			return Result.Failure(Error.NotFound("Patient", request.Id));

		// If identity number changed, ensure uniqueness
		if (!string.Equals(entity.IdentityNumber, request.IdentityNumber, StringComparison.Ordinal))
		{
			var exists = await patientRepository.ExistsByIdentityNumberAsync(request.IdentityNumber, cancellationToken).ConfigureAwait(false);
			if (exists)
				return Result.Failure(Error.Conflict($"Patient with identity '{request.IdentityNumber}' already exists."));
		}

		// Map onto existing entity
		mapper.Map(request, entity);
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

		patientRepository.Update(entity);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

		return Result.Success();
	}
}
