// ================================
// 🔔 NOTIFICATION MODEL - SYNCHRONIZED
// ================================

import {INotificationDocument} from "@app/interfaces/notification/notification.interface";
import {DataTypes, Model, ModelDefined, Optional} from "sequelize";
import logger from "@app/server/logger";
import {sequelize} from "@app/server/database";
import { UserModel } from ".";

// ================================
// 🔔 NOTIFICATION MODEL - SYNCHRONIZED
// ================================

export const NotificationModelName = 'Notifications';

/**
 * Notification Creation Attributes
 *
 * TR: Notification oluşturma için gerekli attribute'lar
 * EN: Required attributes for notification creation
 */
type NotificationCreationAttributes = Optional<INotificationDocument, 'id' | 'createdAt'>;

/**
 * Notification Model - Interface Synchronized
 *
 * TR: Interface ile sync edilmiş Notification modeli. Eğitmenin yapısını korur.
 * EN: Interface-synchronized Notification model. Preserves instructor's structure.
 */
const NotificationModel: ModelDefined<INotificationDocument, NotificationCreationAttributes> = sequelize.define(
    NotificationModelName,
    {
        // ================================
        // 🔗 FOREIGN KEY
        // ================================
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: UserModel,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            validate: {
                notEmpty: {
                    msg: 'User ID cannot be empty'
                }
            }
        },

        // ================================
        // 📝 NOTIFICATION FIELDS (Eğitmenin Orijinal Yapısı)
        // ================================
        groupName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                len: {
                    args: [1, 50],
                    msg: 'Group name must be between 1 and 50 characters'
                },
                notEmpty: {
                    msg: 'Group name cannot be empty'
                }
            }
        },

        emails: {
            type: DataTypes.STRING, // Eğitmenin orijinal yaklaşımı - basit string
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Emails cannot be empty'
                }
            }
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    },
    {
        // ================================
        // 🔧 MODEL OPTIONS
        // ================================
        timestamps: true,
        updatedAt: 'updatedAt', // updatedAt field'ini aktif et

        indexes: [
            {
                fields: ['userId'],
                name: 'notifications_user_id_index'
            },
            {
                fields: ['groupName'],
                name: 'notifications_group_name_index'
            }
        ],

        // ================================
        // 🔧 MODEL HOOKS - Enhanced with Logging
        // ================================
        hooks: {
            /**
             * After Create Hook
             *
             * TR: Notification oluşturulduktan sonra başarılı log
             * EN: Log successful notification creation
             */
            afterCreate: async (notification: Model) => {
                logger.info('New notification created successfully', {
                    notificationId: notification.dataValues.id,
                    userId: notification.dataValues.userId,
                    groupName: notification.dataValues.groupName,
                    emails: notification.dataValues.emails
                });
            },

            /**
             * After Update Hook
             *
             * TR: Notification güncellendikten sonra log
             * EN: Log after notification update
             */
            afterUpdate: async (notification: Model) => {
                logger.debug('Notification updated successfully', {
                    notificationId: notification.dataValues.id,
                    changedFields: Object.keys((notification as any).changed() || {})
                });
            },

            /**
             * Before Validate Hook
             *
             * TR: Validation'dan önce emails string'ini trim et
             * EN: Trim emails string before validation
             */
            beforeValidate: async (notification: Model) => {
                if (notification.dataValues.emails) {
                    // TR: Email string'ini sadece trim et, basit yaklaşım
                    // EN: Just trim email string, simple approach
                    notification.dataValues.emails = notification.dataValues.emails.trim();
                    notification.set('emails', notification.dataValues.emails);
                }
            }
        }
    }
) as ModelDefined<INotificationDocument, NotificationCreationAttributes>;

NotificationModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

export default NotificationModel;