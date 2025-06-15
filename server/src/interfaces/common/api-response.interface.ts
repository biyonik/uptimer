import {IApiError} from "@app/interfaces/common/error.interface";
import {IPagination} from "@app/interfaces/common/pagination.interface";
import {IUserDocument} from "@app/interfaces/user/user.interface";

/**
 * Generic API Response Interface
 *
 * TR: Genel API response wrapper'ı
 * EN: Generic API response wrapper
 */
export interface IApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: IApiError;
    pagination?: IPagination;
    timestamp: string;
}

/**
 * Authentication Response Interface
 *
 * TR: Authentication işlemleri için response interface
 * EN: Response interface for authentication operations
 */
export interface IAuthResponse {
    user: IUserDocument;
    token: string;
    expiresIn: string;
}