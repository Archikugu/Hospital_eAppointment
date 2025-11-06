using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Users.Promote;

public sealed record PromoteToPatientCommand(Guid AppUserId, string FirstName, string LastName, string IdentityNumber) : IRequest<Patient>;

internal sealed class PromoteToPatientCommandHandler(IPatientRepository patientRepository, IUnitOfWork unitOfWork) : IRequestHandler<PromoteToPatientCommand, Patient>
{
    public async Task<Patient> Handle(PromoteToPatientCommand request, CancellationToken cancellationToken)
    {
        if (await patientRepository.ExistsByAppUserIdAsync(request.AppUserId, cancellationToken))
        {
            var currentByUser = await patientRepository.GetByAppUserIdAsync(request.AppUserId, cancellationToken);
            return currentByUser!;
        }

        var exists = await patientRepository.ExistsByIdentityNumberAsync(request.IdentityNumber, cancellationToken);
        if (exists)
        {
            var current = await patientRepository.GetByIdentityNumberAsync(request.IdentityNumber, cancellationToken);
            return current!;
        }

        var patient = new Patient
        {
            AppUserId = request.AppUserId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IdentityNumber = request.IdentityNumber
        };

        await patientRepository.AddAsync(patient, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return patient;
    }
}


