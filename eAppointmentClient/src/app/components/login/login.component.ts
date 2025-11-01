import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse } from '../../models/login.model';
import { HttpService } from '../../services/http.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  loginData: LoginRequest = new LoginRequest();

  constructor(
    private httpService: HttpService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Eğer kullanıcı zaten giriş yapmışsa home'a yönlendir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.httpService.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      userNameOrEmail: this.loginData.userNameOrEmail,
      password: this.loginData.password
    }).subscribe({
      next: (result) => {
        this.isLoading = false;
        
        if (result.isSuccess && result.value) {
          // Token'ı LoginResponse model'inden al ve kaydet
          const loginResponse = new LoginResponse(result.value.token);
          loginResponse.saveToken();

          // Remember me özelliği varsa token'ı daha uzun süre sakla
          if (this.loginData.rememberMe) {
            // Ek bir işlem yapılabilir, şimdilik sadece token kaydediliyor
          }

          // Başarılı login sonrası yönlendirme
          this.router.navigate(['/']);
        } else {
          this.errorMessage = result.error.message || 'Login failed. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An unexpected error occurred. Please try again later.';
        console.error('Login error:', error);
      }
    });
  }
}
