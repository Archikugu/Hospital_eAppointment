import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '../../models/patient.model';
import { HttpService } from '../../services/http.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { PatientFilterPipe } from '../../core/pipes/patient-filter.pipe';
import { TzDatePipe } from '../../core/pipes/tz-date.pipe';
import { SwalService } from '../../core/services/swal.service';

@Component({
	selector: 'app-patients',
	standalone: true,
    imports: [CommonModule, FormsModule, PatientFilterPipe, TzDatePipe],
	templateUrl: './patients.component.html',
	styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
	patients: Patient[] = [];
	searchTerm: string = '';
	isLoading: boolean = false;
	errorMessage: string = '';
	appointmentCounts: Record<string, number> = {};
    nextAppointments: Record<string, Date | string> = {};

	// Create modal state
	showAddModal: boolean = false;
	isSubmitting: boolean = false;
	createRequest: CreatePatientRequest = new CreatePatientRequest();
	validationErrors: string[] = [];

	// Edit modal state
	showEditModal: boolean = false;
	isUpdating: boolean = false;
	editRequest: UpdatePatientRequest = new UpdatePatientRequest();

	// View modal state
	showViewModal: boolean = false;
	viewModel: Patient | null = null;

	constructor(private http: HttpService, private swal: SwalService) {}

	ngOnInit(): void {
		this.loadPatients();
	}

	loadPatients(): void {
		this.isLoading = true;
		this.errorMessage = '';

		this.http.get<Patient[]>(API_ENDPOINTS.PATIENTS.GET_ALL).subscribe({
				next: (result) => {
				if (result.isSuccess && result.value) {
					this.patients = result.value;
						this.loadPatientAppointmentInfo();
				} else {
					this.patients = [];
					this.errorMessage = result.error?.message || 'Failed to load patients';
				}
				this.isLoading = false;
			},
			error: (err) => {
				this.patients = [];
				this.errorMessage = err.error?.message || 'An error occurred while loading patients';
				this.isLoading = false;
			}
		});
	}

	private loadPatientAppointmentInfo(): void {
        // Her hasta için randevuları çek, say ve en yakın tarihi bul
        this.nextAppointments = {};
		this.patients.forEach(p => {
			this.http.get<any[]>(API_ENDPOINTS.APPOINTMENTS.GET_ALL + `?patientId=${p.id}`).subscribe({
				next: (res) => {
					const items = res.isSuccess ? (res.value || []) : [];
					this.appointmentCounts[p.id] = items.length;
					if (items.length > 0) {
						// En yakın gelecek randevu (UTC kabul et; UI'da tz pipe ile yerel göster)
						const now = new Date();
						const future = items
							.map(a => this.parseUtcDate(a.startDate || a.StartDate || a.start || a.Start))
							.filter(d => !isNaN(d.getTime()) && d >= now)
							.sort((a,b) => +a - +b);
						if (future.length > 0) {
                            const d = future[0];
                            // Her zaman Date instance tutalım
                            this.nextAppointments[p.id] = new Date(d.getTime());
						} else {
							this.nextAppointments[p.id] = '';
						}
					} else {
						this.appointmentCounts[p.id] = 0;
						this.nextAppointments[p.id] = '';
					}
				},
				error: () => {
					this.appointmentCounts[p.id] = 0;
					this.nextAppointments[p.id] = '';
				}
			});
		});
	}

	private parseUtcDate(value: any): Date {
		if (!value) return new Date(NaN);
		if (value instanceof Date) return value;
		if (typeof value === 'string') {
			// Eğer sonu 'Z' ile bitmiyorsa ve timezone içermiyorsa UTC varsay
			const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
			const iso = hasTz ? value : `${value}Z`;
			return new Date(iso);
		}
		return new Date(value);
	}

	private formatDateTimeTz(d: Date, timeZone: string): string {
		const fmt = new Intl.DateTimeFormat('tr-TR', {
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit', hour12: false,
			timeZone
		});
		// e.g. "10.11.2025 09:00"
		return fmt.format(d).replace(',', '');
	}

	// Create Patient
	openAddPatientModal(): void {
		this.showAddModal = true;
		this.createRequest = new CreatePatientRequest({ firstName: '', lastName: '', identityNumber: '' });
		this.validationErrors = [];
	}

	closeAddPatientModal(): void {
		this.showAddModal = false;
		this.createRequest = new CreatePatientRequest();
		this.validationErrors = [];
	}

	createPatient(): void {
		this.validationErrors = this.createRequest.getValidationErrors();
		if (this.validationErrors.length > 0) return;

		this.isSubmitting = true;
		const payload = {
			firstName: this.createRequest.firstName.trim(),
			lastName: this.createRequest.lastName.trim(),
			identityNumber: this.createRequest.identityNumber.trim(),
			birthDate: this.createRequest.birthDate,
			gender: this.createRequest.gender
		};
		this.http.post<Patient>(API_ENDPOINTS.PATIENTS.CREATE, payload).subscribe({
			next: (result) => {
				if (result.isSuccess && result.value) {
					this.closeAddPatientModal();
					this.loadPatients();
					this.swal.toastSuccess('Patient created successfully');
				} else {
					const msg = result.error?.message || 'Failed to create patient';
					this.validationErrors = [msg];
					this.swal.toastError(msg);
				}
				this.isSubmitting = false;
			},
			error: (err) => {
				const msg = err.error?.message || 'An error occurred while creating patient';
				this.validationErrors = [msg];
				this.isSubmitting = false;
				this.swal.toastError(msg);
			}
		});
	}

	// Edit Patient
	openEditPatientModal(id: string): void {
		const p = this.patients.find(x => x.id === id);
		if (!p) return;
		this.editRequest = new UpdatePatientRequest({
			id: p.id,
			firstName: p.firstName,
			lastName: p.lastName,
			identityNumber: p.identityNumber || '',
			birthDate: p.birthDate,
			gender: p.gender
		});
		this.validationErrors = [];
		this.showEditModal = true;
	}

	closeEditPatientModal(): void {
		this.showEditModal = false;
		this.editRequest = new UpdatePatientRequest();
		this.validationErrors = [];
	}

	updatePatient(): void {
		this.validationErrors = this.editRequest.getValidationErrors();
		if (this.validationErrors.length > 0) return;

		this.isUpdating = true;
		const payload = {
			id: this.editRequest.id,
			firstName: this.editRequest.firstName.trim(),
			lastName: this.editRequest.lastName.trim(),
			identityNumber: this.editRequest.identityNumber.trim(),
			birthDate: this.editRequest.birthDate,
			gender: this.editRequest.gender
		};
		this.http.put<void>(API_ENDPOINTS.PATIENTS.UPDATE(this.editRequest.id), payload).subscribe({
			next: (result) => {
				if (result.isSuccess) {
					this.showEditModal = false;
					this.swal.toastSuccess('Patient updated');
					this.loadPatients();
				} else {
					const msg = result.error?.message || 'Failed to update patient';
					this.validationErrors = [msg];
					this.swal.toastError(msg);
				}
				this.isUpdating = false;
			},
			error: (err) => {
				const msg = err.error?.message || 'An error occurred while updating patient';
				this.validationErrors = [msg];
				this.isUpdating = false;
				this.swal.toastError(msg);
			}
		});
	}

	// Delete
	async deletePatient(id: string): Promise<void> {
		const p = this.patients.find(x => x.id === id);
		const name = p ? `${p.firstName} ${p.lastName}` : 'this patient';
		const ok = await this.swal.confirm({
			titleText: 'Hasta silme işlemi',
			html: `'<strong>${name}</strong>' adlı hastayı silmek istiyor musunuz?`,
			icon: 'warning',
			confirmButtonText: 'Evet, Sil',
			cancelButtonText: 'Vazgeç',
			confirmButtonColor: '#d33',
			cancelButtonColor: '#6c757d',
			focusCancel: true,
			reverseButtons: true
		});
		if (!ok) return;

		this.http.delete<void>(API_ENDPOINTS.PATIENTS.DELETE(id)).subscribe({
			next: (result) => {
				if (result.isSuccess) {
					this.swal.toastSuccess('Patient deleted');
					this.loadPatients();
				} else {
					this.swal.toastError(result.error?.message || 'Failed to delete patient');
				}
			},
			error: () => this.swal.toastError('An error occurred while deleting patient')
		});
	}

	// trackBy
	trackByPatientId = (_: number, item: Patient) => item.id;

	openViewPatientModal(p: Patient): void {
		this.viewModel = p;
		this.showViewModal = true;
	}

	closeViewPatientModal(): void {
		this.showViewModal = false;
		this.viewModel = null;
	}

	onViewEditPatient(): void {
		const id = this.viewModel?.id;
		this.closeViewPatientModal();
		if (id) this.openEditPatientModal(id);
	}
}
