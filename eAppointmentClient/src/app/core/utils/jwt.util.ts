export class JwtUtil {
  /**
   * JWT token formatını kontrol eder (3 parça olmalı: header.payload.signature)
   */
  static isValidJwtFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    // JWT token 3 parçadan oluşmalı
    if (parts.length !== 3) {
      return false;
    }

    // Her parça boş olmamalı
    if (parts.some(part => !part || part.trim().length === 0)) {
      return false;
    }

    return true;
  }

  /**
   * JWT token'ı decode eder
   */
  static decodeToken(token: string): any {
    try {
      // Önce format kontrolü yap
      if (!this.isValidJwtFormat(token)) {
        return null;
      }

      const parts = token.split('.');
      const base64Url = parts[1]; // Payload (2. parça)
      
      if (!base64Url) {
        return null;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      
      // Payload bir obje olmalı
      if (!payload || typeof payload !== 'object') {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Token'ın geçerli olup olmadığını kontrol eder
   */
  static isTokenValid(token: string): boolean {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return false;
    }

    // JWT format kontrolü (3 parça olmalı)
    if (!this.isValidJwtFormat(token)) {
      return false;
    }

    // Token decode edilmeli
    const decodedToken = this.decodeToken(token);
    if (!decodedToken) {
      return false;
    }

    // Expiration kontrolü
    if (decodedToken.exp) {
      const expirationDate = new Date(decodedToken.exp * 1000); // exp Unix timestamp (saniye)
      const currentDate = new Date();

      if (currentDate > expirationDate) {
        return false; // Token süresi dolmuş
      }
    }

    return true;
  }

  /**
   * Token'ın expire olacağı tarihi döndürür
   */
  static getTokenExpiration(token: string): Date | null {
    const decodedToken = this.decodeToken(token);
    if (!decodedToken || !decodedToken.exp) {
      return null;
    }

    return new Date(decodedToken.exp * 1000);
  }

  /**
   * Token'dan kullanıcı bilgilerini alır
   */
  static getTokenPayload(token: string): any {
    return this.decodeToken(token);
  }
}

