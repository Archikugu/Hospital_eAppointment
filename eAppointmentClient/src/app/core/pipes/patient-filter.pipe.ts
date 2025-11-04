import { Pipe, PipeTransform } from '@angular/core';
import { Patient } from '../../models/patient.model';

@Pipe({ name: 'patientFilter', standalone: true })
export class PatientFilterPipe implements PipeTransform {
	transform(patients: Patient[] | null | undefined, searchTerm: string = ''): Patient[] {
		if (!Array.isArray(patients) || patients.length === 0) return [];

		const search = (searchTerm || '').trim().toLowerCase();
		if (!search) return patients;

		return patients.filter(p => {
			const first = (p.firstName || '').toLowerCase();
			const last = (p.lastName || '').toLowerCase();
			const gender = (p.gender || '').toString().toLowerCase();
			const birth = (p.birthDate || '').toString().toLowerCase();
			const identity = (p.identityNumber || '').toString().toLowerCase();
			return first.includes(search) || last.includes(search) || gender.includes(search) || birth.includes(search) || identity.includes(search);
		});
	}
}
