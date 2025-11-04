using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using MediatR;

namespace eAppointment.Application.Features.Doctors.CreateDoctor;

public sealed record CreateDoctorCommand(
    string FirstName,
    string LastName,
    int DepartmentValue
) : IRequest<Result<Doctor>>;

