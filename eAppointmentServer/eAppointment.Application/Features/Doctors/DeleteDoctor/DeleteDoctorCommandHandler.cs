using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Doctors.DeleteDoctor;

internal sealed class DeleteDoctorCommandHandler(
	IDoctorRepository doctorRepository,
	IAppointmentRepository appointmentRepository,
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

		// Doktora ait TÜM randevuları iptal et (geçmiş/gelecek fark etmeksizin)
		var doctorAppointments = await appointmentRepository.GetByDoctorIdAsync(doctor.Id, cancellationToken).ConfigureAwait(false);
		foreach (var appt in doctorAppointments.Where(a => !a.IsCancelled))
		{
			appt.IsCancelled = true;
			appointmentRepository.Update(appt);
		}

		// Her zaman soft-delete uygula: ilişkili randevular olsa da olmasa da
		doctor.IsActive = false;
		doctor.AppUserId = null;
		doctorRepository.Update(doctor);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

		return Result.Success();
	}
}
