using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Patients.DeletePatient;

internal sealed class DeletePatientCommandHandler(
	IPatientRepository patientRepository,
	IAppointmentRepository appointmentRepository,
	IUnitOfWork unitOfWork
) : IRequestHandler<DeletePatientCommand, Result>
{
	public async Task<Result> Handle(DeletePatientCommand request, CancellationToken cancellationToken)
	{
		var entity = await patientRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
		if (entity is null)
			return Result.Failure(Error.NotFound("Patient", request.Id));

        // Hastaya ait TÜM randevuları iptal et (geçmiş/gelecek fark etmeksizin)
        var patientAppointments = await appointmentRepository.GetByPatientIdAsync(entity.Id, cancellationToken).ConfigureAwait(false);
        foreach (var appt in patientAppointments.Where(a => !a.IsCancelled))
        {
            appt.IsCancelled = true;
            appointmentRepository.Update(appt);
        }

        // Her zaman soft-delete uygula: ilişkili randevular olsa da olmasa da
		entity.IsActive = false;
		entity.AppUserId = null;
		patientRepository.Update(entity);
		await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
		return Result.Success();
	}
}
