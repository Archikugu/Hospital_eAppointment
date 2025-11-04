using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Patients.DeletePatient;

public sealed record DeletePatientCommand(Guid Id) : IRequest<Result>;
