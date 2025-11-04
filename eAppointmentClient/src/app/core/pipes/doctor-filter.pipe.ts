import { Pipe, PipeTransform } from '@angular/core';
import { Doctor } from '../../models/doctor.model';

@Pipe({ name: 'doctorFilter', standalone: true })
export class DoctorFilterPipe implements PipeTransform {
	transform(doctors: Doctor[] | null | undefined, searchTerm: string = '', selectedDepartment: string = ''): Doctor[] {
		if (!Array.isArray(doctors) || doctors.length === 0) return [];

		let filtered = doctors;

		// Search by first/last name and department text
		const search = (searchTerm || '').trim().toLowerCase();
		if (search) {
			filtered = filtered.filter(d => {
				const first = (d.firstName || '').toLowerCase();
				const last = (d.lastName || '').toLowerCase();
				const deptText = typeof d.department === 'object'
					? `${d.department.displayName || ''} ${d.department.name || ''}`.toLowerCase()
					: String(d.department || '').toLowerCase();
				return first.includes(search) || last.includes(search) || deptText.includes(search);
			});
		}

		// Filter by department (value as string)
		const dept = (selectedDepartment || '').trim();
		if (dept) {
			filtered = filtered.filter(d => {
				const value = typeof d.department === 'object' ? String(d.department.value) : String(d.department || '');
				return value === dept;
			});
		}

		return filtered;
	}
}
