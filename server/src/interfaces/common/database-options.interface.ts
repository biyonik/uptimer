/**
 * Database Options Interface
 *
 * TR: Database işlemleri için seçenekler
 * EN: Options for database operations
 */
export interface IDbOptions {
    transaction?: any;
    include?: any[];
    attributes?: string[];
    order?: [string, string][];
    limit?: number;
    offset?: number;
}