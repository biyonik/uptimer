/**
 * Notification Query Interface
 *
 * TR: Bildirim sorguları için interface
 * EN: Interface for notification queries
 */
export interface INotificationQuery {
    userId?: string;
    groupName?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'groupName';
    sortOrder?: 'asc' | 'desc';
}