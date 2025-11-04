import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class SwalService {
	private defaultConfirmOptions: SweetAlertOptions = {
		titleText: 'Emin misiniz?',
		text: 'Bu işlemi geri alamazsınız.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonText: 'Evet',
		cancelButtonText: 'İptal'
	};

	private defaultToastOptions: SweetAlertOptions = {
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer: 3000,
		timerProgressBar: true
	};

	alert(title: string, text = '', icon: SweetAlertIcon = 'info', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return Swal.fire({ titleText: title, text, icon, ...options } as SweetAlertOptions);
	}

	success(title = 'Başarılı', text = '', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.alert(title, text, 'success', options);
	}

	error(title = 'Hata', text = 'Bir hata oluştu', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.alert(title, text, 'error', options);
	}

	warning(title = 'Uyarı', text = '', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.alert(title, text, 'warning', options);
	}

	info(title = 'Bilgi', text = '', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.alert(title, text, 'info', options);
	}

	question(title = 'Soru', text = '', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.alert(title, text, 'question', options);
	}

	toast(message: string, icon: SweetAlertIcon = 'success', options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return Swal.fire({
			...this.defaultToastOptions,
			icon,
			titleText: message,
			...options
		} as SweetAlertOptions);
	}

	toastSuccess(message: string, options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.toast(message, 'success', options);
	}

	toastError(message: string, options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
		return this.toast(message, 'error', options);
	}

	confirm(options: SweetAlertOptions = {}): Promise<boolean> {
		const finalOptions: SweetAlertOptions = { ...this.defaultConfirmOptions, ...options } as SweetAlertOptions;
		return Swal.fire(finalOptions as SweetAlertOptions).then(r => r.isConfirmed === true);
	}

	deleteConfirm(itemName = 'kaydı', options: SweetAlertOptions = {}): Promise<boolean> {
		return this.confirm({
			titleText: 'Silme işlemi',
			text: `${itemName} silmek istediğinize emin misiniz?`,
			icon: 'warning',
			confirmButtonText: 'Evet, Sil',
			cancelButtonText: 'Vazgeç',
			...options
		} as SweetAlertOptions);
	}
}
