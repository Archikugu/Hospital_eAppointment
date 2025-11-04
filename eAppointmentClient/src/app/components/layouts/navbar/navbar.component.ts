import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { LoginResponse } from '../../../models/login.model';
import { JwtUtil } from '../../../core/utils/jwt.util';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  userFirstName: string = '';
  userLastName: string = '';
  isMenuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    const token = LoginResponse.getToken();
    if (token) {
      const payload = JwtUtil.getTokenPayload(token);
      if (payload) {
        this.userName = payload.UserName || payload.name || 'User';
        this.userRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
        this.userFirstName = payload.FirstName || '';
        this.userLastName = payload.LastName || '';
      }
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    if (this.userFirstName && this.userLastName) {
      return `${this.userFirstName} ${this.userLastName}`;
    }
    return this.userName;
  }

  getUserInitials(): string {
    if (this.userFirstName && this.userLastName) {
      return `${this.userFirstName.charAt(0)}${this.userLastName.charAt(0)}`.toUpperCase();
    }
    return this.userName.charAt(0).toUpperCase();
  }
}
