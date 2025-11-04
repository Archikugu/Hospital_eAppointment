using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using MediatR;

namespace eAppointment.Application.Features.Patients.GetAllPatients;

public sealed record GetAllPatientsQuery() : IRequest<Result<List<Patient>>>;
