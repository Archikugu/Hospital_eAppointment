using eAppointment.Domain.Entities;
using eAppointment.Domain.Enums;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Users.Promote;

public sealed record PromoteToDoctorCommand(Guid AppUserId, string FirstName, string LastName, int DepartmentValue) : IRequest<Doctor>;

internal sealed class PromoteToDoctorCommandHandler(IDoctorRepository doctorRepository, IUnitOfWork unitOfWork) : IRequestHandler<PromoteToDoctorCommand, Doctor>
{
    public async Task<Doctor> Handle(PromoteToDoctorCommand request, CancellationToken cancellationToken)
    {
        if (await doctorRepository.ExistsByAppUserIdAsync(request.AppUserId, cancellationToken))
        {
            var currentByUser = await doctorRepository.GetByAppUserIdAsync(request.AppUserId, cancellationToken);
            return currentByUser!;
        }

        var exists = await doctorRepository.ExistsByFullNameAsync(request.FirstName, request.LastName, cancellationToken);
        if (exists)
        {
            var current = await doctorRepository.GetByFullNameAsync(request.FirstName, request.LastName, cancellationToken);
            return current!;
        }

        var department = Department.FromValue(request.DepartmentValue);
        if (department is null)
        {
            throw new ArgumentException($"Invalid department value: {request.DepartmentValue}");
        }

        var doctor = new Doctor
        {
            AppUserId = request.AppUserId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Department = department,
            IsActive = true
        };

        await doctorRepository.AddAsync(doctor, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return doctor;
    }
}


