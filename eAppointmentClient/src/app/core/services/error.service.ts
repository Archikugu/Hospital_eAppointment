import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { SwalService } from './swal.service';

export interface NormalizedError {
	status: number;
	message: string;
	details?: string[];
	raw?: any;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
	private toastr = inject(ToastrService);
	private swal = inject(SwalService);

	normalize(error: unknown): NormalizedError {
		if (error instanceof HttpErrorResponse) {
			const status = error.status || 0;
			const body = error.error;
			let message = 'An unexpected error occurred';
			const details: string[] = [];

			if (typeof body === 'string') {
				message = body;
			} else if (body && typeof body === 'object') {
				// Our API Result<...> format { isSuccess, error: { code, message, details } }
				const apiMessage = body?.error?.message || body?.message;
				if (apiMessage) message = apiMessage;

				const apiDetails = body?.error?.details || body?.details || body?.errors;
				if (Array.isArray(apiDetails)) {
					details.push(...apiDetails.map((d: any) => String(d)));
				} else if (apiDetails && typeof apiDetails === 'object') {
					// ModelState dictionary
					Object.values(apiDetails).forEach((arr: any) => {
						if (Array.isArray(arr)) details.push(...arr.map(v => String(v)));
					});
				}
			}

			return { status, message, details: details.length ? details : undefined, raw: error };
		}

		// Fallback
		return { status: 0, message: 'An unexpected error occurred', raw: error };
	}

	notify(error: unknown, useDialog = false): NormalizedError {
		const normalized = this.normalize(error);
		const fullMessage = normalized.details && normalized.details.length
			? `${normalized.message}\n- ${normalized.details.join('\n- ')}`
			: normalized.message;

		if (useDialog) {
			this.swal.error('Error', fullMessage);
		} else {
			this.toastr.error(fullMessage, 'Error');
		}
		return normalized;
	}
}
