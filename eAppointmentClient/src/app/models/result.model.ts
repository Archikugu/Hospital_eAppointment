export class Error {
  code: string = '';
  message: string = '';

  constructor(code: string = '', message: string = '') {
    this.code = code;
    this.message = message;
  }

  static none(): Error {
    return new Error('', '');
  }

  static failure(code: string, message: string): Error {
    return new Error(code, message);
  }

  static notFound(entityName: string, id: any): Error {
    return new Error('Error.NotFound', `${entityName} with id ${id} was not found.`);
  }

  static validation(message: string): Error {
    return new Error('Error.Validation', message);
  }

  static conflict(message: string): Error {
    return new Error('Error.Conflict', message);
  }
}

export class Result<T = any> {
  isSuccess: boolean = false;
  isFailure: boolean = true;
  error: Error = Error.none();
  value?: T;

  private constructor(isSuccess: boolean, error: Error, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this.value = value;
  }

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, Error.none(), value);
  }

  static failure<T>(error: Error): Result<T> {
    return new Result<T>(false, error, undefined);
  }
}

export interface ApiResponse<T = any> {
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    message: string;
  };
  value?: T;
}

