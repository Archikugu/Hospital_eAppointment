// Department Interface
export interface Department {
  value: number;
  name: string;
  displayName: string;
  description: string;
}

// Department Enum Values (for easy access)
export enum DepartmentValue {
  Cardiology = 1,
  Neurology = 2,
  Orthopedics = 3,
  Pediatrics = 4,
  Gynecology = 5,
  InternalMedicine = 6,
  GeneralSurgery = 7,
  Ophthalmology = 8,
  Dermatology = 9,
  Psychiatry = 10,
  Emergency = 11,
  Radiology = 12,
  Urology = 13,
  ENT = 14,
  Oncology = 15,
  Anesthesiology = 16,
  Pathology = 17,
  PhysicalTherapy = 18
}

// All Departments (for dropdowns, filters, etc.)
export const ALL_DEPARTMENTS: Department[] = [
  { value: 1, name: 'Cardiology', displayName: 'Kardiyoloji', description: 'Kalp ve dolaşım sistemi hastalıkları' },
  { value: 2, name: 'Neurology', displayName: 'Nöroloji', description: 'Sinir sistemi hastalıkları' },
  { value: 3, name: 'Orthopedics', displayName: 'Ortopedi', description: 'Kemik, eklem ve kas hastalıkları' },
  { value: 4, name: 'Pediatrics', displayName: 'Pediatri', description: 'Çocuk hastalıkları' },
  { value: 5, name: 'Gynecology', displayName: 'Kadın Hastalıkları ve Doğum', description: 'Kadın sağlığı ve doğum' },
  { value: 6, name: 'InternalMedicine', displayName: 'İç Hastalıkları', description: 'Genel dahiliye' },
  { value: 7, name: 'GeneralSurgery', displayName: 'Genel Cerrahi', description: 'Cerrahi müdahaleler' },
  { value: 8, name: 'Ophthalmology', displayName: 'Göz Hastalıkları', description: 'Göz sağlığı' },
  { value: 9, name: 'Dermatology', displayName: 'Dermatoloji', description: 'Cilt hastalıkları' },
  { value: 10, name: 'Psychiatry', displayName: 'Psikiyatri', description: 'Ruh sağlığı' },
  { value: 11, name: 'Emergency', displayName: 'Acil Servis', description: 'Acil tıbbi müdahaleler' },
  { value: 12, name: 'Radiology', displayName: 'Radyoloji', description: 'Görüntüleme ve tanı' },
  { value: 13, name: 'Urology', displayName: 'Üroloji', description: 'İdrar yolları ve erkek sağlığı' },
  { value: 14, name: 'ENT', displayName: 'Kulak Burun Boğaz', description: 'KBB hastalıkları' },
  { value: 15, name: 'Oncology', displayName: 'Onkoloji', description: 'Kanser tedavisi' },
  { value: 16, name: 'Anesthesiology', displayName: 'Anesteziyoloji', description: 'Anestezi ve reanimasyon' },
  { value: 17, name: 'Pathology', displayName: 'Patoloji', description: 'Hastalık tanısı' },
  { value: 18, name: 'PhysicalTherapy', displayName: 'Fizik Tedavi', description: 'Rehabilitasyon' }
];

// Helper function to get department by value
export function getDepartmentByValue(value: number): Department | undefined {
  return ALL_DEPARTMENTS.find(d => d.value === value);
}

// Helper function to get department display name
export function getDepartmentDisplayName(department: Department | string | undefined): string {
  if (!department) return 'N/A';
  
  if (typeof department === 'string') {
    return department;
  }
  
  return department.displayName || department.name || 'N/A';
}

// Doctor Interface
export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Computed property from backend, optional since we can calculate it
  department: Department | string; // Can be object or string depending on API response
  appointments?: any[]; // Navigation property, optional
}

// Doctor Class (with helper methods)
export class DoctorModel implements Doctor {
  id: string = '';
  firstName: string = '';
  lastName: string = '';
  fullName: string = '';
  department: Department | string;
  appointments?: any[];

  constructor(data?: Partial<Doctor>) {
    if (data) {
      this.id = data.id || '';
      this.firstName = data.firstName || '';
      this.lastName = data.lastName || '';
      this.fullName = data.fullName || this.getFullName();
      this.department = data.department || ALL_DEPARTMENTS[0];
      this.appointments = data.appointments || [];
    } else {
      this.department = ALL_DEPARTMENTS[0];
      this.appointments = [];
    }
  }

  // Get full name (FirstName + LastName in uppercase)
  getFullName(): string {
    if (this.fullName) {
      return this.fullName;
    }
    return `${this.firstName} ${this.lastName.toUpperCase()}`;
  }

  // Get initials for avatar
  getInitials(): string {
    const first = this.firstName.charAt(0).toUpperCase();
    const last = this.lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  }

  // Get department display name
  getDepartmentDisplayName(): string {
    return getDepartmentDisplayName(this.department);
  }

  // Get department value (for API calls)
  getDepartmentValue(): number {
    if (typeof this.department === 'object') {
      return this.department.value;
    }
    // If string, try to find in ALL_DEPARTMENTS
    const dept = ALL_DEPARTMENTS.find(d => d.name === this.department || d.displayName === this.department);
    return dept?.value || 0;
  }

  // Check if doctor has appointments
  hasAppointments(): boolean {
    return !!(this.appointments && this.appointments.length > 0);
  }

  // Get appointments count
  getAppointmentsCount(): number {
    return this.appointments?.length || 0;
  }
}

// Create Doctor Request (for POST requests)
export class CreateDoctorRequest {
  firstName: string = '';
  lastName: string = '';
  departmentValue: number = 0; // Default: no department selected

  constructor(data?: Partial<CreateDoctorRequest>) {
    if (data) {
      this.firstName = data.firstName || '';
      this.lastName = data.lastName || '';
      this.departmentValue = data.departmentValue !== undefined ? data.departmentValue : 0;
    }
  }

  // Validation
  isValid(): boolean {
    return this.firstName.trim().length > 0 && 
           this.lastName.trim().length > 0 && 
           this.departmentValue > 0;
  }

  // Get validation errors
  getValidationErrors(): string[] {
    const errors: string[] = [];
    
    if (this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }
    
    if (this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }
    
    if (this.departmentValue <= 0) {
      errors.push('Department is required');
    }
    
    return errors;
  }
}

// Update Doctor Request (for PUT requests)
export class UpdateDoctorRequest extends CreateDoctorRequest {
  id: string = '';

  constructor(data?: Partial<UpdateDoctorRequest>) {
    super(data);
    if (data?.id) {
      this.id = data.id;
    }
  }

  override isValid(): boolean {
    return super.isValid() && this.id.trim().length > 0;
  }

  override getValidationErrors(): string[] {
    const errors = super.getValidationErrors();
    
    if (this.id.trim().length === 0) {
      errors.push('Doctor ID is required');
    }
    
    return errors;
  }
}

