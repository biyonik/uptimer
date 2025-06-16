// ================================
// 🔔 NOTIFICATION SERVICE - ENHANCED BUSINESS LOGIC LAYER
// ================================

import { NotificationModel, UserModel } from "@app/models";
import {
    INotificationDocument,
    INotificationCreate,
    INotificationUpdate
} from "@app/interfaces/notification/notification.interface";
import { IServiceResult } from "@app/interfaces/common/service-result.interface";
import { IDbOptions } from "@app/interfaces/common/database-options.interface";
import { INotificationQuery } from "@app/interfaces/notification/notification.query.interface";
import { INotificationStats } from "@app/interfaces/notification/notification.stats.interface";
import { IPagination } from "@app/interfaces/common/pagination.interface";
import logger from "@app/server/logger";
import { Op } from "sequelize";

/**
 * NotificationService Class - Professional Business Logic Layer
 *
 * TR: Professional notification business logic yönetimi. Email group management,
 *     user-based filtering, comprehensive CRUD operations.
 *
 * EN: Professional notification business logic management. Email group management,
 *     user-based filtering, comprehensive CRUD operations.
 */
export class NotificationService {
    /**
     * Create new notification with validation
     *
     * TR: Validation ile yeni bildirim oluştur
     * EN: Create new notification with validation
     */
    static async createNotification(notificationData: INotificationCreate, options?: IDbOptions): Promise<IServiceResult<INotificationDocument>> {
        try {
            logger.info('Creating new notification', {
                userId: notificationData.userId,
                groupName: notificationData.groupName,
                emailCount: notificationData.emails.split(',').length
            });

            // TR: User existence check
            // EN: User existence check
            const userExists = await UserModel.findByPk(notificationData.userId, {
                attributes: ['id'],
                ...options
            });

            if (!userExists) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            // TR: Group name uniqueness check for this user
            // EN: Group name uniqueness check for this user
            const existingGroup = await NotificationModel.findOne({
                where: {
                    userId: notificationData.userId,
                    groupName: notificationData.groupName
                },
                attributes: ['id'],
                ...options
            });

            if (existingGroup) {
                return {
                    success: false,
                    error: 'Group name already exists for this user',
                    statusCode: 409
                };
            }

            // TR: Email validation - basic format check
            // EN: Email validation - basic format check
            const emailList = notificationData.emails.split(',').map(email => email.trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emailList.filter(email => !emailRegex.test(email));

            if (invalidEmails.length > 0) {
                return {
                    success: false,
                    error: `Invalid email format: ${invalidEmails.join(', ')}`,
                    statusCode: 400
                };
            }

            // TR: Notification oluştur
            // EN: Create notification
            const notification = await NotificationModel.create(notificationData as any, options);

            logger.info('Notification created successfully', {
                notificationId: notification.dataValues.id,
                userId: notification.dataValues.userId,
                groupName: notification.dataValues.groupName,
                emailCount: emailList.length
            });

            return {
                success: true,
                data: notification.dataValues,
                statusCode: 201
            };

        } catch (error) {
            logger.error('Error creating notification:', { error, notificationData });
            return {
                success: false,
                error: 'Failed to create notification',
                statusCode: 500
            };
        }
    }

    /**
     * Get notification by ID
     *
     * TR: ID ile bildirim getir
     * EN: Get notification by ID
     */
    static async getNotificationById(notificationId: string, options?: IDbOptions): Promise<IServiceResult<INotificationDocument>> {
        try {
            const notification = await NotificationModel.findByPk(notificationId, {
                include: [
                    {
                        model: UserModel,
                        as: 'user',
                        attributes: ['id', 'username', 'email']
                    }
                ],
                ...options
            });

            if (!notification) {
                return {
                    success: false,
                    error: 'Notification not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: notification.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching notification by ID:', { error, notificationId });
            return {
                success: false,
                error: 'Failed to fetch notification',
                statusCode: 500
            };
        }
    }

    /**
     * Get notifications by user ID
     *
     * TR: Kullanıcı ID'sine göre bildirimleri getir
     * EN: Get notifications by user ID
     */
    static async getNotificationsByUserId(userId: string, options?: IDbOptions): Promise<IServiceResult<INotificationDocument[]>> {
        try {
            const notifications = await NotificationModel.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                ...options
            });

            return {
                success: true,
                data: notifications.map(n => n.dataValues),
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching notifications by user ID:', { error, userId });
            return {
                success: false,
                error: 'Failed to fetch notifications',
                statusCode: 500
            };
        }
    }

    /**
     * Update notification
     *
     * TR: Bildirim güncelle
     * EN: Update notification
     */
    static async updateNotification(notificationId: string, updateData: INotificationUpdate, options?: IDbOptions): Promise<IServiceResult<INotificationDocument>> {
        try {
            logger.info('Updating notification', { notificationId, updateFields: Object.keys(updateData) });

            // TR: Notification existence check
            // EN: Notification existence check
            const existingNotification = await NotificationModel.findByPk(notificationId, options);

            if (!existingNotification) {
                return {
                    success: false,
                    error: 'Notification not found',
                    statusCode: 404
                };
            }

            // TR: Group name uniqueness check (eğer group name değişiyorsa)
            // EN: Group name uniqueness check (if group name is changing)
            if (updateData.groupName) {
                const existingGroup = await NotificationModel.findOne({
                    where: {
                        userId: existingNotification.dataValues.userId,
                        groupName: updateData.groupName,
                        id: { [Op.ne]: notificationId } // TR: Mevcut notification hariç | EN: Exclude current notification
                    },
                    attributes: ['id'],
                    ...options
                });

                if (existingGroup) {
                    return {
                        success: false,
                        error: 'Group name already exists for this user',
                        statusCode: 409
                    };
                }
            }

            // TR: Email validation (eğer emails değişiyorsa)
            // EN: Email validation (if emails are changing)
            if (updateData.emails) {
                const emailList = updateData.emails.split(',').map(email => email.trim());
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const invalidEmails = emailList.filter(email => !emailRegex.test(email));

                if (invalidEmails.length > 0) {
                    return {
                        success: false,
                        error: `Invalid email format: ${invalidEmails.join(', ')}`,
                        statusCode: 400
                    };
                }
            }

            const [affectedRows] = await NotificationModel.update(updateData, {
                where: { id: notificationId },
                ...options
            });

            if (affectedRows === 0) {
                return {
                    success: false,
                    error: 'No changes made',
                    statusCode: 400
                };
            }

            // TR: Güncellenmiş notification'ı getir
            // EN: Fetch updated notification
            const updatedNotification = await NotificationModel.findByPk(notificationId, {
                include: [
                    {
                        model: UserModel,
                        as: 'user',
                        attributes: ['id', 'username', 'email']
                    }
                ],
                ...options
            });

            logger.info('Notification updated successfully', { notificationId });

            return {
                success: true,
                data: updatedNotification!.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error updating notification:', { error, notificationId, updateData });
            return {
                success: false,
                error: 'Failed to update notification',
                statusCode: 500
            };
        }
    }

    /**
     * Delete notification
     *
     * TR: Bildirim sil
     * EN: Delete notification
     */
    static async deleteNotification(notificationId: string, options?: IDbOptions): Promise<IServiceResult<boolean>> {
        try {
            logger.info('Deleting notification', { notificationId });

            const deletedRows = await NotificationModel.destroy({
                where: { id: notificationId },
                ...options
            });

            if (deletedRows === 0) {
                return {
                    success: false,
                    error: 'Notification not found',
                    statusCode: 404
                };
            }

            logger.info('Notification deleted successfully', { notificationId });

            return {
                success: true,
                data: true,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error deleting notification:', { error, notificationId });
            return {
                success: false,
                error: 'Failed to delete notification',
                statusCode: 500
            };
        }
    }

    /**
     * Get notifications with pagination and filtering
     *
     * TR: Pagination ve filtreleme ile bildirimleri getir
     * EN: Get notifications with pagination and filtering
     */
    static async getNotifications(query: INotificationQuery, options?: IDbOptions): Promise<IServiceResult<{ notifications: INotificationDocument[], pagination: IPagination }>> {
        try {
            const {
                userId,
                groupName,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            // TR: Search conditions
            // EN: Search conditions
            let whereConditions: any = {};

            if (userId) {
                whereConditions.userId = userId;
            }

            if (groupName) {
                whereConditions.groupName = { [Op.iLike]: `%${groupName}%` };
            }

            // TR: Pagination
            // EN: Pagination
            const offset = (page - 1) * limit;

            // TR: Count total notifications
            // EN: Count total notifications
            const total = await NotificationModel.count({
                where: whereConditions,
                ...options
            });

            // TR: Fetch notifications
            // EN: Fetch notifications
            const notifications = await NotificationModel.findAll({
                where: whereConditions,
                include: [
                    {
                        model: UserModel,
                        as: 'user',
                        attributes: ['id', 'username', 'email']
                    }
                ],
                limit,
                offset,
                order: [[sortBy, sortOrder.toUpperCase()]],
                ...options
            });

            // TR: Pagination info
            // EN: Pagination info
            const totalPages = Math.ceil(total / limit);
            const pagination: IPagination = {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };

            const notificationData = notifications.map(notification => notification.dataValues);

            return {
                success: true,
                data: {
                    notifications: notificationData,
                    pagination
                },
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching notifications:', { error, query });
            return {
                success: false,
                error: 'Failed to fetch notifications',
                statusCode: 500
            };
        }
    }

    /**
     * Get notification statistics
     *
     * TR: Bildirim istatistiklerini getir
     * EN: Get notification statistics
     */
    static async getNotificationStats(userId?: string, options?: IDbOptions): Promise<IServiceResult<INotificationStats>> {
        try {
            const whereCondition = userId ? { userId } : {};

            // TR: Total notifications
            // EN: Total notifications
            const totalNotifications = await NotificationModel.count({
                where: whereCondition,
                ...options
            });

            // TR: Notifications created today
            // EN: Notifications created today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const notificationsToday = await NotificationModel.count({
                where: {
                    ...whereCondition,
                    createdAt: {
                        [Op.gte]: today
                    }
                },
                ...options
            });

            // TR: Notifications by user (if not filtered by user)
            // EN: Notifications by user (if not filtered by user)
            const notificationsByUser = userId ? totalNotifications : await NotificationModel.count({
                where: whereCondition,
                ...options
            });

            const stats: INotificationStats = {
                totalNotifications,
                notificationsToday,
                notificationsByUser
            };

            return {
                success: true,
                data: stats,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching notification stats:', { error, userId });
            return {
                success: false,
                error: 'Failed to fetch notification statistics',
                statusCode: 500
            };
        }
    }

    /**
     * Get notification groups by user
     *
     * TR: Kullanıcının bildirim gruplarını getir
     * EN: Get user's notification groups
     */
    static async getNotificationGroups(userId: string, options?: IDbOptions): Promise<IServiceResult<string[]>> {
        try {
            const notifications = await NotificationModel.findAll({
                where: { userId },
                attributes: ['groupName'],
                group: ['groupName'],
                order: [['groupName', 'ASC']],
                ...options
            });

            const groups = notifications.map(n => n.dataValues.groupName);

            return {
                success: true,
                data: groups,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching notification groups:', { error, userId });
            return {
                success: false,
                error: 'Failed to fetch notification groups',
                statusCode: 500
            };
        }
    }

    /**
     * Bulk delete notifications
     *
     * TR: Toplu bildirim silme
     * EN: Bulk delete notifications
     */
    static async bulkDeleteNotifications(notificationIds: string[], options?: IDbOptions): Promise<IServiceResult<number>> {
        try {
            logger.info('Bulk deleting notifications', { count: notificationIds.length });

            const deletedRows = await NotificationModel.destroy({
                where: {
                    id: {
                        [Op.in]: notificationIds
                    }
                },
                ...options
            });

            logger.info('Bulk delete completed', { deletedCount: deletedRows });

            return {
                success: true,
                data: deletedRows,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error bulk deleting notifications:', { error, notificationIds });
            return {
                success: false,
                error: 'Failed to delete notifications',
                statusCode: 500
            };
        }
    }

    /**
     * Create notification group
     * TR: Bildirim grubu oluştur
     * EN: Create notification group
     * @param notificationData
     * @param options
     */
    static async createNotificationGroup(notificationData: INotificationCreate, options?: IDbOptions): Promise<IServiceResult<INotificationDocument>> {
        try {
            logger.info('Creating notification group', {
                userId: notificationData.userId,
                groupName: notificationData.groupName
            });

            // TR: User existence check
            // EN: User existence check
            const userExists = await UserModel.findByPk(notificationData.userId, {
                attributes: ['id'],
                ...options
            });

            if (!userExists) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            // TR: Group name uniqueness check for this user
            // EN: Group name uniqueness check for this user
            const existingGroup = await NotificationModel.findOne({
                where: {
                    userId: notificationData.userId,
                    groupName: notificationData.groupName
                },
                attributes: ['id'],
                ...options
            });

            if (existingGroup) {
                return {
                    success: false,
                    error: 'Group name already exists for this user',
                    statusCode: 409
                };
            }

            // TR: Create notification group
            // EN: Create notification group
            const notification = await NotificationModel.create(notificationData as any, options);

            logger.info('Notification group created successfully', {
                notificationId: notification.dataValues.id,
                userId: notification.dataValues.userId,
                groupName: notification.dataValues.groupName
            });

            return {
                success: true,
                data: notification.dataValues,
                statusCode: 201
            };

        } catch (error) {
            logger.error('Error creating notification group:', { error, notificationData });
            return {
                success: false,
                error: 'Failed to create notification group',
                statusCode: 500
            };
        }
    }

    /**
     * Update notification group name
     * TR: Bildirim grup adını güncelle
     * EN: Update notification group name
     * @param notificationId
     * @param groupName
     * @param options
     */
    static async updateNotificationGroup(notificationId: string, groupName: string, options?: IDbOptions): Promise<IServiceResult<INotificationDocument>> {
        try {
            logger.info('Updating notification group', { notificationId, groupName });

            const [affectedRows, [updatedNotification]] = await NotificationModel.update(
                { groupName },
                {
                    where: { id: notificationId },
                    returning: true,
                    ...options
                }
            );

            if (affectedRows === 0) {
                return {
                    success: false,
                    error: 'Notification not found or no changes made',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: updatedNotification.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error updating notification group:', { error, notificationId, groupName });
            return {
                success: false,
                error: 'Failed to update notification group',
                statusCode: 500
            };
        }
    }

    /**
     * Delete notification group
     * TR: Bildirim grubunu sil
     * EN: Delete notification group
     */
    static async deleteNotificationGroup(groupName: string, userId: string, options?: IDbOptions): Promise<IServiceResult<boolean>> {
        try {
            logger.info('Deleting notification group', { groupName, userId });

            const deletedRows = await NotificationModel.destroy({
                where: {
                    groupName,
                    userId
                },
                ...options
            });

            if (deletedRows === 0) {
                return {
                    success: false,
                    error: 'Notification group not found or no notifications in this group',
                    statusCode: 404
                };
            }

            logger.info('Notification group deleted successfully', { groupName, userId });

            return {
                success: true,
                data: true,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error deleting notification group:', { error, groupName, userId });
            return {
                success: false,
                error: 'Failed to delete notification group',
                statusCode: 500
            };
        }
    }
}