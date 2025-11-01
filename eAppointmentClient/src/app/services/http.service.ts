import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Result, Error, ApiResponse } from '../models/result.model';
import { API_CONFIG } from '../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private baseUrl = API_CONFIG.baseUrl;

  constructor(
    private http: HttpClient
  ) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleResponse<T>(response: T | ApiResponse<T>): Result<T> {
    // Backend'den gelen response direkt T tipinde olabilir (success durumunda)
    // veya ApiResponse<T> formatında olabilir
    if (this.isApiResponse(response)) {
      // ApiResponse formatında ise
      if (response.isSuccess && response.value !== undefined) {
        return Result.success(response.value);
      }

      const error = response.error
        ? new Error(response.error.code, response.error.message)
        : Error.failure('Error.Unknown', 'An unknown error occurred.');

      return Result.failure<T>(error);
    }

    // Direkt T tipinde ise (backend success durumunda direkt value döndürüyor)
    return Result.success(response as T);
  }

  private isApiResponse<T>(response: any): response is ApiResponse<T> {
    return response && typeof response === 'object' && 'isSuccess' in response;
  }

  private handleError<T>(error: HttpErrorResponse): Observable<Result<T>> {
    // Backend error response formatı: { message: string }
    if (error.error?.message) {
      // Backend'den gelen error mesajı
      let errorCode = 'Error.Unknown';
      
      // HTTP status koduna göre error code belirle
      if (error.status === 400) {
        errorCode = 'Error.Validation';
      } else if (error.status === 404) {
        errorCode = 'Error.NotFound';
      } else if (error.status === 409) {
        errorCode = 'Error.Conflict';
      }

      return of(Result.failure<T>(Error.failure(errorCode, error.error.message)));
    }

    if (error.status === 0) {
      return of(Result.failure<T>(Error.failure('Error.Network', 'Network error. Please check your connection.')));
    }

    if (error.status === 401) {
      return of(Result.failure<T>(Error.failure('Error.Unauthorized', 'Unauthorized. Please login again.')));
    }

    if (error.status === 403) {
      return of(Result.failure<T>(Error.failure('Error.Forbidden', 'You do not have permission to perform this action.')));
    }

    if (error.status === 404) {
      return of(Result.failure<T>(Error.notFound('Resource', 'unknown')));
    }

    if (error.status === 500) {
      return of(Result.failure<T>(Error.failure('Error.Server', 'Server error. Please try again later.')));
    }

    return of(Result.failure<T>(Error.failure(`Error.${error.status}`, error.message || 'An error occurred.')));
  }

  get<T>(endpoint: string, params?: HttpParams | { [param: string]: any }): Observable<Result<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options = {
      headers: this.getHeaders(),
      params: params
    };

    return this.http.get<T | ApiResponse<T>>(url, options).pipe(
      map(response => this.handleResponse<T>(response)),
      catchError((error: HttpErrorResponse) => this.handleError<T>(error))
    );
  }

  post<T>(endpoint: string, body: any): Observable<Result<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options = {
      headers: this.getHeaders()
    };

    return this.http.post<T | ApiResponse<T>>(url, body, options).pipe(
      map(response => this.handleResponse<T>(response)),
      catchError((error: HttpErrorResponse) => this.handleError<T>(error))
    );
  }

  put<T>(endpoint: string, body: any): Observable<Result<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options = {
      headers: this.getHeaders()
    };

    return this.http.put<T | ApiResponse<T>>(url, body, options).pipe(
      map(response => this.handleResponse<T>(response)),
      catchError((error: HttpErrorResponse) => this.handleError<T>(error))
    );
  }

  delete<T>(endpoint: string): Observable<Result<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options = {
      headers: this.getHeaders()
    };

    return this.http.delete<T | ApiResponse<T>>(url, options).pipe(
      map(response => this.handleResponse<T>(response)),
      catchError((error: HttpErrorResponse) => this.handleError<T>(error))
    );
  }

  patch<T>(endpoint: string, body: any): Observable<Result<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options = {
      headers: this.getHeaders()
    };

    return this.http.patch<T | ApiResponse<T>>(url, body, options).pipe(
      map(response => this.handleResponse<T>(response)),
      catchError((error: HttpErrorResponse) => this.handleError<T>(error))
    );
  }
}
