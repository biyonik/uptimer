/**
 * User Query Interface
 *
 * TR: Kullanıcı sorguları için interface
 * EN: Interface for user queries
 */
export interface IUserQuery {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'username' | 'email';
    sortOrder?: 'asc' | 'desc';
}