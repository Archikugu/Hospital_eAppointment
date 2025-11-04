import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Doctor, Department, ALL_DEPARTMENTS, getDepartmentDisplayName, CreateDoctorRequest, UpdateDoctorRequest } from '../../models/doctor.model';
import { HttpService } from '../../services/http.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { SwalService } from '../../core/services/swal.service';
import { DoctorFilterPipe } from '../../core/pipes/doctor-filter.pipe';

@Component({
  selector: 'app-doctors',
  imports: [CommonModule, FormsModule, DoctorFilterPipe],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.css'
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchTerm: string = '';
  selectedDepartment: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  // Create Doctor Modal
  showAddModal: boolean = false;
  isSubmitting: boolean = false;
  createRequest: CreateDoctorRequest = new CreateDoctorRequest();
  validationErrors: string[] = [];

  // Edit Doctor Modal
  showEditModal: boolean = false;
  isUpdating: boolean = false;
  editRequest: UpdateDoctorRequest = new UpdateDoctorRequest();

  // Departments from model
  departments: Department[] = ALL_DEPARTMENTS;

  constructor(private httpService: HttpService, private swal: SwalService) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.httpService.get<Doctor[]>(API_ENDPOINTS.DOCTORS.GET_ALL).subscribe({
      next: (result) => {
        if (result.isSuccess && result.value) {
          this.doctors = result.value;
          this.filteredDoctors = [...this.doctors];
        } else {
          this.errorMessage = result.error?.message || 'Failed to load doctors';
          this.doctors = [];
          this.filteredDoctors = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading doctors';
        this.doctors = [];
        this.filteredDoctors = [];
        this.isLoading = false;
      }
    });
  }

  filterDoctors(): void {
    let filtered = [...this.doctors];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.firstName.toLowerCase().includes(search) ||
        doctor.lastName.toLowerCase().includes(search)
      );
    }

    // Department filter
    if (this.selectedDepartment) {
      filtered = filtered.filter(doctor => {
        const dept = typeof doctor.department === 'object' 
          ? doctor.department.value 
          : doctor.department;
        return dept?.toString() === this.selectedDepartment;
      });
    }

    this.filteredDoctors = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.filterDoctors();
  }

  getDoctorInitials(doctor: Doctor): string {
    return `${doctor.firstName.charAt(0)}${doctor.lastName.charAt(0)}`.toUpperCase();
  }

  getDepartmentName(department?: Doctor['department']): string {
    return getDepartmentDisplayName(department);
  }

  get uniqueDepartments(): string[] {
    const deptSet = new Set<string>();
    this.doctors.forEach(doctor => {
      const dept = typeof doctor.department === 'object' 
        ? doctor.department.displayName 
        : doctor.department;
      if (dept) deptSet.add(dept);
    });
    return Array.from(deptSet);
  }

  openAddDoctorModal(): void {
    this.showAddModal = true;
    this.createRequest = new CreateDoctorRequest({
      firstName: '',
      lastName: '',
      departmentValue: 0 // Default olarak hiçbir departman seçili olmasın
    });
    this.validationErrors = [];
  }

  closeAddDoctorModal(): void {
    this.showAddModal = false;
    this.createRequest = new CreateDoctorRequest({
      firstName: '',
      lastName: '',
      departmentValue: 0
    });
    this.validationErrors = [];
  }

  createDoctor(): void {
    // Validation
    this.validationErrors = this.createRequest.getValidationErrors();
    
    if (this.validationErrors.length > 0) {
      return;
    }

    this.isSubmitting = true;
    this.validationErrors = [];

    this.httpService.post<Doctor>(API_ENDPOINTS.DOCTORS.CREATE, {
      firstName: this.createRequest.firstName.trim(),
      lastName: this.createRequest.lastName.trim(),
      departmentValue: this.createRequest.departmentValue
    }).subscribe({
      next: (result) => {
        if (result.isSuccess && result.value) {
          // Başarılı - modalı kapat ve listeyi yenile
          this.closeAddDoctorModal();
          this.loadDoctors();
          this.swal.toastSuccess('Doctor created successfully');
        } else {
          const msg = result.error?.message || 'Failed to create doctor';
          this.validationErrors = [msg];
          this.swal.toastError(msg);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        const msg = error.error?.message || 'An error occurred while creating doctor';
        this.validationErrors = [msg];
        this.isSubmitting = false;
        this.swal.toastError(msg);
      }
    });
  }

  // EDIT FLOW
  editDoctor(id?: string): void {
    if (!id) return;
    const doc = this.doctors.find(d => d.id === id);
    if (!doc) return;

    // Prepare edit request
    const deptValue = typeof doc.department === 'object' ? doc.department.value : 0;
    this.editRequest = new UpdateDoctorRequest({
      id: doc.id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      departmentValue: deptValue
    });
    this.validationErrors = [];
    this.showEditModal = true;
  }

  closeEditDoctorModal(): void {
    this.showEditModal = false;
    this.editRequest = new UpdateDoctorRequest();
    this.validationErrors = [];
  }

  updateDoctor(): void {
    // Basic validation (reuse CreateDoctor rules plus id)
    this.validationErrors = this.editRequest.getValidationErrors();
    if (this.validationErrors.length > 0) return;

    this.isUpdating = true;

    const payload = {
      id: this.editRequest.id,
      firstName: this.editRequest.firstName.trim(),
      lastName: this.editRequest.lastName.trim(),
      departmentValue: this.editRequest.departmentValue
    };

    this.httpService.put<void>(API_ENDPOINTS.DOCTORS.UPDATE(this.editRequest.id), payload).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.showEditModal = false;
          this.swal.toastSuccess('Doctor updated');
          this.loadDoctors();
        } else {
          const msg = result.error?.message || 'Failed to update doctor';
          this.validationErrors = [msg];
          this.swal.toastError(msg);
        }
        this.isUpdating = false;
      },
      error: (error) => {
        const msg = error.error?.message || 'An error occurred while updating doctor';
        this.validationErrors = [msg];
        this.isUpdating = false;
        this.swal.toastError(msg);
      }
    });
  }

  viewDoctor(id?: string): void {
    console.log('View doctor:', id);
  }

  async deleteDoctor(id?: string): Promise<void> {
    if (!id) return;
    const doctor = this.doctors.find(d => d.id === id);
    const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : 'bu doktoru';

    const ok = await this.swal.confirm({
      titleText: 'Doktor silme işlemi',
      html: `'<strong>${doctorName}</strong>' adlı doktoru silmek istiyor musunuz?`,
      icon: 'warning',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'Vazgeç',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      focusCancel: true,
      reverseButtons: true
    });
    if (!ok) return;

    this.httpService.delete<void>(API_ENDPOINTS.DOCTORS.DELETE(id)).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.swal.toastSuccess('Doctor deleted');
          this.loadDoctors();
        } else {
          const msg = result.error?.message || 'Failed to delete doctor';
          this.swal.toastError(msg);
        }
      },
      error: () => {
        this.swal.toastError('An error occurred while deleting doctor');
      }
    });
  }
}
