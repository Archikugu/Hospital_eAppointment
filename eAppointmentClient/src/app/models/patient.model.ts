// Patient Interface
export interface Patient {
	id: string;
	firstName: string;
	lastName: string;
	fullName?: string;
	identityNumber?: string;
	birthDate?: string; // ISO string (yyyy-MM-dd)
	gender?: 'Male' | 'Female' | 'Other' | string;
}

export class PatientModel implements Patient {
	id: string = '';
	firstName: string = '';
	lastName: string = '';
	fullName: string = '';
	identityNumber?: string;
	birthDate?: string;
	gender?: 'Male' | 'Female' | 'Other' | string;

	constructor(data?: Partial<Patient>) {
		if (data) {
			this.id = data.id || '';
			this.firstName = data.firstName || '';
			this.lastName = data.lastName || '';
			this.fullName = data.fullName || `${this.firstName} ${this.lastName.toUpperCase()}`;
			this.identityNumber = data.identityNumber;
			this.birthDate = data.birthDate;
			this.gender = data.gender;
		}
	}

	getInitials(): string {
		const f = this.firstName.charAt(0).toUpperCase();
		const l = this.lastName.charAt(0).toUpperCase();
		return `${f}${l}`;
	}
}

export class CreatePatientRequest {
	firstName: string = '';
	lastName: string = '';
	identityNumber: string = '';
	birthDate?: string;
	gender?: 'Male' | 'Female' | 'Other' | string;

	constructor(data?: Partial<CreatePatientRequest>) {
		if (data) {
			this.firstName = data.firstName || '';
			this.lastName = data.lastName || '';
			this.identityNumber = data.identityNumber || '';
			this.birthDate = data.birthDate;
			this.gender = data.gender;
		}
	}

	isValid(): boolean {
		return this.firstName.trim().length > 0 && this.lastName.trim().length > 0 && this.isIdentityValid();
	}

	private isIdentityValid(): boolean {
		const val = (this.identityNumber || '').trim();
		return val.length === 11 && /^\d{11}$/.test(val);
	}

	getValidationErrors(): string[] {
		const errors: string[] = [];
		if (this.firstName.trim().length === 0) errors.push('First name is required');
		if (this.lastName.trim().length === 0) errors.push('Last name is required');
		const idVal = (this.identityNumber || '').trim();
		if (idVal.length === 0) errors.push('Identity number is required');
		else if (!(idVal.length === 11 && /^\d{11}$/.test(idVal))) errors.push('Identity number must be 11 digits');
		return errors;
	}
}

export class UpdatePatientRequest extends CreatePatientRequest {
	id: string = '';
	constructor(data?: Partial<UpdatePatientRequest>) {
		super(data);
		if (data?.id) this.id = data.id;
	}
	override isValid(): boolean {
		return super.isValid() && this.id.trim().length > 0;
	}
	override getValidationErrors(): string[] {
		const errors = super.getValidationErrors();
		if (this.id.trim().length === 0) errors.push('Patient ID is required');
		return errors;
	}
}
