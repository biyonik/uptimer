// ================================
// 🔔 NOTIFICATION MODEL - COLUMN NAMES FIXED
// ================================

import {INotificationDocument} from "@app/interfaces/notification/notification.interface";
import {DataTypes, Model, ModelDefined, Optional} from "sequelize";
import logger from "@app/server/logger";
import {sequelize} from "@app/server/database";

// ================================
// 🔔 NOTIFICATION MODEL - COLUMN MAPPING FIXED
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
 * Notification Model - Column Names Fixed for Sequelize
 *
 * TR: Sequelize underscored: true ile uyumlu column mapping'i
 * EN: Column mapping compatible with Sequelize underscored: true
 */
const NotificationModel: ModelDefined<INotificationDocument, NotificationCreationAttributes> = sequelize.define(
    NotificationModelName,
    {
        // ================================
        // 🆔 PRIMARY KEY
        // ================================
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        // ================================
        // 🔗 FOREIGN KEY - Column name explicitly mapped
        // ================================
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id', // TR: Database'de user_id olarak | EN: As user_id in database
            validate: {
                notEmpty: {
                    msg: 'User ID cannot be empty'
                }
            }
        },

        // ================================
        // 📝 NOTIFICATION FIELDS
        // ================================
        groupName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'group_name', // TR: Database'de group_name olarak | EN: As group_name in database
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
            type: DataTypes.STRING(255), // Length limit eklendi
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Emails cannot be empty'
                },
                len: {
                    args: [1, 255],
                    msg: 'Emails string too long'
                }
            }
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
            field: 'created_at' // TR: Database'de created_at olarak | EN: As created_at in database
        },

        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
            field: 'updated_at' // TR: Database'de updated_at olarak | EN: As updated_at in database
        }
    },
    {
        // ================================
        // 🔧 MODEL OPTIONS - Fixed for underscored
        // ================================
        tableName: 'Notifications', // Explicit table name
        timestamps: true,
        underscored: true, // TR: Snake case column names | EN: Snake case column names
        createdAt: 'created_at',
        updatedAt: 'updated_at',

        indexes: [
            {
                fields: ['user_id'], // Snake case
                name: 'notifications_user_id_index'
            },
            {
                fields: ['group_name'], // Snake case
                name: 'notifications_group_name_index'
            },
            {
                fields: ['created_at'], // Snake case
                name: 'notifications_created_at_index'
            }
        ],

        // ================================
        // 🔧 MODEL HOOKS - Simplified
        // ================================
        hooks: {
            /**
             * After Create Hook
             */
            afterCreate: async (notification: Model) => {
                try {
                    logger.info('New notification created successfully', {
                        notificationId: notification.dataValues.id,
                        userId: notification.dataValues.userId,
                        groupName: notification.dataValues.groupName,
                        emails: notification.dataValues.emails
                    });
                } catch (hookError) {
                    logger.warn('Error in afterCreate hook:', { hookError });
                }
            },

            /**
             * Before Validate Hook - Simple trim only
             */
            beforeValidate: async (notification: Model) => {
                try {
                    if (notification.dataValues.emails) {
                        notification.dataValues.emails = notification.dataValues.emails.trim();
                        notification.set('emails', notification.dataValues.emails);
                    }

                    if (notification.dataValues.groupName) {
                        notification.dataValues.groupName = notification.dataValues.groupName.trim();
                        notification.set('groupName', notification.dataValues.groupName);
                    }
                } catch (hookError) {
                    logger.warn('Error in beforeValidate hook:', { hookError });
                }
            }
        }
    }
) as ModelDefined<INotificationDocument, NotificationCreationAttributes>;

export default NotificationModel;