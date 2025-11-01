export class LoginRequest {
  userNameOrEmail: string = '';
  password: string = '';
  rememberMe: boolean = false;
}

export class LoginResponse {
  token: string = '';

  constructor(token: string) {
    this.token = token;
  }

  // Token'ı localStorage'a kaydetmek için helper method
  saveToken(): void {
    if (this.token) {
      localStorage.setItem('token', this.token);
    }
  }

  // Token'ı localStorage'dan silmek için helper method
  static clearToken(): void {
    localStorage.removeItem('token');
  }

  // Token'ı localStorage'dan almak için static method
  static getToken(): string | null {
    return localStorage.getItem('token');
  }
}

