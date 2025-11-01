import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { JwtUtil } from '../core/utils/jwt.util';
import { LoginResponse } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  /**
   * Token'ın varlığını ve geçerliliğini kontrol eder (sadece frontend validasyonu)
   */
  isAuthenticated(): boolean {
    const token: string | null = LoginResponse.getToken();

    if (!token) {
      return false;
    }

    // Token format ve expiration kontrolü (frontend)
    if (!JwtUtil.isTokenValid(token)) {
      // Geçersiz token'ı temizle
      LoginResponse.clearToken();
      return false;
    }

    return true;
  }

  /**
   * Token'ı temizler ve login sayfasına yönlendirir
   */
  logout(): void {
    LoginResponse.clearToken();
    this.router.navigate(['/login']);
  }

  /**
   * Functional guard için kullanılır
   * Not: Backend signature kontrolü HTTP interceptor tarafından yapılıyor
   * İlk API çağrısında geçersiz token tespit edilirse 401 dönecek ve interceptor token'ı temizleyecek
   */
  canActivate(): boolean {
    // Frontend validasyonu yap (format ve expiration)
    // Backend signature kontrolü interceptor tarafından yapılacak
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

/**
 * Functional guard - Route protection için kullanılır
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.canActivate();
};
