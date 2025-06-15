/**
 * API Error Interface
 *
 * TR: API hata response'ları için interface
 * EN: Interface for API error responses
 */
export interface IApiError {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path: string;
}

/**
 * Validation Error Interface
 *
 * TR: Validation hataları için interface
 * EN: Interface for validation errors
 */
export interface IValidationError {
    field: string;
    message: string;
    value?: any;
}