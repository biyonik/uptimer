/**
 * Pagination Interface
 *
 * TR: Sayfalama için genel interface
 * EN: General interface for pagination
 */
export interface IPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}