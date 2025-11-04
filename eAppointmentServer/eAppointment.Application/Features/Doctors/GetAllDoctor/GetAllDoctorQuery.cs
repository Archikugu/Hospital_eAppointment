using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using MediatR;

namespace eAppointment.Application.Features.Doctors.GetAllDoctor;

public sealed record GetAllDoctorQuery(
    bool SortByDepartment = false,
    bool SortByFullName = false,
    bool SortDescending = false
) : IRequest<Result<List<Doctor>>>;
