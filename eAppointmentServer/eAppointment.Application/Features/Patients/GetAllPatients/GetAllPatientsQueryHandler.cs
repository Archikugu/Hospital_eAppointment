using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Patients.GetAllPatients;

internal sealed class GetAllPatientsQueryHandler(IPatientRepository patientRepository)
	: IRequestHandler<GetAllPatientsQuery, Result<List<Patient>>>
{
	public async Task<Result<List<Patient>>> Handle(GetAllPatientsQuery request, CancellationToken cancellationToken)
	{
		var items = await patientRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
		return Result.Success(items.ToList());
	}
}
