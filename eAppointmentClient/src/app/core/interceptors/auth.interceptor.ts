import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoginResponse } from '../../models/login.model';
import { ErrorService } from '../services/error.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorService = inject(ErrorService);

  // Token'ı localStorage'dan al
  const token = LoginResponse.getToken();

  // Request'i clone et ve Authorization header'ını ekle (token varsa)
  let clonedRequest = req;
  
  if (token && !req.headers.has('Authorization')) {
    // Login endpoint'ine token ekleme (login isteği zaten token gerektirmez)
    if (!req.url.includes('/auth/login')) {
      clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(clonedRequest).pipe(
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
      } else {
        // İsteğe özel hata bastırma: X-Suppress-Error: true ise global bildirim yapma
        const suppress = req.headers.get('X-Suppress-Error');
        if (!suppress || suppress.toLowerCase() !== 'true') {
          errorService.notify(error);
        }
      }

      return throwError(() => error);
    })
  );
};

