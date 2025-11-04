using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Doctors.GetAllDoctor;

internal sealed class GetAllDoctorQueryHandler(IDoctorRepository doctorRepository) : IRequestHandler<GetAllDoctorQuery, Result<List<Doctor>>>
{
    public async Task<Result<List<Doctor>>> Handle(GetAllDoctorQuery request, CancellationToken cancellationToken)
    {
        var doctors = await doctorRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
        var doctorList = doctors.ToList();

        // Sıralama işlemleri
        if (request.SortByDepartment || request.SortByFullName)
        {
            IOrderedEnumerable<Doctor>? orderedDoctors = null;

            // Önce departmana göre sırala
            if (request.SortByDepartment)
            {
                orderedDoctors = request.SortDescending
                    ? doctorList.OrderByDescending(d => d.Department.Value)
                    : doctorList.OrderBy(d => d.Department.Value);

                // Sonra full name'e göre sırala
                if (request.SortByFullName)
                {
                    orderedDoctors = request.SortDescending
                        ? orderedDoctors.ThenByDescending(d => d.FirstName).ThenByDescending(d => d.LastName)
                        : orderedDoctors.ThenBy(d => d.FirstName).ThenBy(d => d.LastName);
                }
            }
            // Sadece full name'e göre sırala
            else if (request.SortByFullName)
            {
                orderedDoctors = request.SortDescending
                    ? doctorList.OrderByDescending(d => d.FirstName).ThenByDescending(d => d.LastName)
                    : doctorList.OrderBy(d => d.FirstName).ThenBy(d => d.LastName);
            }

            if (orderedDoctors != null)
            {
                doctorList = orderedDoctors.ToList();
            }
        }

        return Result.Success(doctorList);
    }
}