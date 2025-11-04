using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Doctors.DeleteDoctor;

public sealed record DeleteDoctorCommand(Guid Id) : IRequest<Result>;
