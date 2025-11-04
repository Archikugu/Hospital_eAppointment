using AutoMapper;
using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Enums;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Doctors.CreateDoctor;

internal sealed class CreateDoctorCommandHandler(
    IDoctorRepository doctorRepository,
    IUnitOfWork unitOfWork,
    IMapper mapper) : IRequestHandler<CreateDoctorCommand, Result<Doctor>>
{
    public async Task<Result<Doctor>> Handle(CreateDoctorCommand request, CancellationToken cancellationToken)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            return Result.Failure<Doctor>(Error.Validation("First name is required."));
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            return Result.Failure<Doctor>(Error.Validation("Last name is required."));
        }

        // Department validation
        var department = Department.FromValue(request.DepartmentValue);
        if (department == null)
        {
            return Result.Failure<Doctor>(Error.Validation($"Invalid department value: {request.DepartmentValue}"));
        }

        // Check if doctor with same name already exists
        var exists = await doctorRepository.ExistsByFullNameAsync(
            request.FirstName, 
            request.LastName, 
            cancellationToken).ConfigureAwait(false);

        if (exists)
        {
            return Result.Failure<Doctor>(Error.Conflict($"Doctor with name '{request.FirstName} {request.LastName}' already exists."));
        }

        // Map command to entity using AutoMapper
        var doctor = mapper.Map<Doctor>(request);
        doctor.Department = department; // Set department after mapping (ignored in mapping profile)

        // Add to repository
        await doctorRepository.AddAsync(doctor, cancellationToken).ConfigureAwait(false);

        // Save changes
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success(doctor);
    }
}

