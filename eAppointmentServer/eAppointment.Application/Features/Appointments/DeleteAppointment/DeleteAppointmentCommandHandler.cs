using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Appointments.DeleteAppointment;

internal sealed class DeleteAppointmentCommandHandler(
    IAppointmentRepository appointmentRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteAppointmentCommand, Result>
{
    public async Task<Result> Handle(DeleteAppointmentCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result.Failure(Error.Validation("Id is required"));

        var entity = await appointmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
            return Result.Failure(Error.NotFound("Appointment", request.Id));

        appointmentRepository.Remove(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}


