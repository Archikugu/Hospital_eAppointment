import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoginResponse } from '../../models/login.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Eğer 401 Unauthorized hatası alınırsa (geçersiz/expired token)
      if (error.status === 401) {
        // Token'ı temizle
        LoginResponse.clearToken();
        
        // Sadece login endpoint'i değilse login sayfasına yönlendir
        // (Login sayfasında yönlendirme yapılmaması için)
        if (!req.url.includes('/auth/login')) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};

