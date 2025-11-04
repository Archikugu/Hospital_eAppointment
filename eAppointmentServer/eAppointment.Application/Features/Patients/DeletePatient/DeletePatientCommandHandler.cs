using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Patients.DeletePatient;

internal sealed class DeletePatientCommandHandler(
	IPatientRepository patientRepository,
	IUnitOfWork unitOfWork
) : IRequestHandler<DeletePatientCommand, Result>
{
	public async Task<Result> Handle(DeletePatientCommand request, CancellationToken cancellationToken)
	{
		var entity = await patientRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
		if (entity is null)
			return Result.Failure(Error.NotFound("Patient", request.Id));

		patientRepository.Remove(entity);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
		return Result.Success();
	}
}
