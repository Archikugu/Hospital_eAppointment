using eAppointment.Application.Common.Models;
using eAppointment.Domain.Enums;
using eAppointment.Domain.Repositories;
using MediatR;
using AutoMapper;

namespace eAppointment.Application.Features.Doctors.UpdateDoctor;

internal sealed class UpdateDoctorCommandHandler(
	IDoctorRepository doctorRepository,
	IUnitOfWork unitOfWork,
	IMapper mapper
) : IRequestHandler<UpdateDoctorCommand, Result>
{
	public async Task<Result> Handle(UpdateDoctorCommand request, CancellationToken cancellationToken)
	{
		if (request.Id == Guid.Empty)
			return Result.Failure(Error.Validation("Invalid doctor id."));

		if (string.IsNullOrWhiteSpace(request.FirstName))
			return Result.Failure(Error.Validation("First name is required."));

		if (string.IsNullOrWhiteSpace(request.LastName))
			return Result.Failure(Error.Validation("Last name is required."));

		var department = Department.FromValue(request.DepartmentValue);
		if (department is null)
			return Result.Failure(Error.Validation($"Invalid department value: {request.DepartmentValue}"));

		var doctor = await doctorRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
		if (doctor is null)
			return Result.Failure(Error.NotFound("Doctor", request.Id));

		// Check uniqueness for full name, excluding current entity
		var conflict = await doctorRepository.ExistsByFullNameAsync(request.FirstName, request.LastName, cancellationToken).ConfigureAwait(false);
		if (conflict && !(doctor.FirstName == request.FirstName && doctor.LastName == request.LastName))
			return Result.Failure(Error.Conflict($"Doctor with name '{request.FirstName} {request.LastName}' already exists."));

		// Map incoming fields onto existing entity
		mapper.Map(request, doctor);
		doctor.Department = department; // set Department manually

		// Track and persist
		doctorRepository.Update(doctor);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

		return Result.Success();
	}
}
