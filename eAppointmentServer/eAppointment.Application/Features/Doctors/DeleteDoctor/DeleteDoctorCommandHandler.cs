using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Doctors.DeleteDoctor;

internal sealed class DeleteDoctorCommandHandler(
	IDoctorRepository doctorRepository,
	IUnitOfWork unitOfWork
) : IRequestHandler<DeleteDoctorCommand, Result>
{
	public async Task<Result> Handle(DeleteDoctorCommand request, CancellationToken cancellationToken)
	{
		var doctor = await doctorRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
		if (doctor is null)
		{
			return Result.Failure(Error.NotFound("Doctor", request.Id));
		}

		doctorRepository.Remove(doctor);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

		return Result.Success();
	}
}
