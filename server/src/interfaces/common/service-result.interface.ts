/**
 * Service Result Interface
 *
 * TR: Service layer'dan dönen sonuç interface'i
 * EN: Interface for results returned from service layer
 */
export interface IServiceResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}
