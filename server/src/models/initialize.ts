import logger from "@app/server/logger";
import {config} from "@app/server/config";
import {sequelize} from "@app/server/database";
import UserModel from "@app/models/user.model";
import NotificationModel from "@app/models/notification.model";

/**
 * Initialize all models and associations - FIXED VERSION
 *
 * TR: Tüm model'leri ve association'ları initialize et. Hata çözülmüş versiyon.
 * EN: Initialize all models and associations. Fixed error version.
 */
let modelsInitialized = false;

export const initializeModels = async (): Promise<void> => {
    // TR: Zaten initialize edildiyse tekrar etme
    // EN: Don't initialize again if already done
    if (modelsInitialized) {
        logger.debug('Models already initialized, skipping...');
        return;
    }

    try {
        logger.info('Initializing models...');



        logger.debug('Models imported successfully');

        // TR: Association'ları kur - Model'ler import edildikten sonra
        // EN: Set up associations - after models are imported
        try {
            // User has many Notifications
            UserModel.hasMany(NotificationModel, {
                foreignKey: 'userId',
                as: 'notifications',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            });

            // Notification belongs to User
            NotificationModel.belongsTo(UserModel, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            });

            logger.debug('Model associations created successfully');

        } catch (associationError) {
            logger.error('Error creating model associations:', { associationError });
            throw new Error(`Association setup failed: ${associationError}`);
        }

        // TR: Model'leri sync et (sadece development'ta)
        // EN: Sync models (only in development)
        if (config.isDevelopment) {
            try {
                // TR: Önce database connection'ı test et
                // EN: First test database connection
                await sequelize.authenticate();
                logger.debug('Database connection verified for model sync');

                // TR: User model'i önce sync et (foreign key dependency)
                // EN: Sync User model first (foreign key dependency)
                await UserModel.sync({ alter: true, force: true });
                logger.debug('User model synchronized');

                // TR: Notification model'i sonra sync et
                // EN: Sync Notification model after
                await NotificationModel.sync({ alter: true, force: true });
                logger.debug('Notification model synchronized');

                logger.info('Models synchronized successfully');

            } catch (syncError) {
                logger.error('Error synchronizing models:', { syncError });
                throw new Error(`Model synchronization failed: ${syncError}`);
            }
        } else {
            logger.info('Production mode: Skipping model sync');
        }

        modelsInitialized = true;
        logger.info('✅ Models initialized successfully');

    } catch (error) {
        logger.error('❌ Failed to initialize models:', {
            error: error.message,
            stack: error.stack
        });

        // TR: Model initialization başarısız olursa state'i reset et
        // EN: Reset state if model initialization fails
        modelsInitialized = false;

        throw new Error(`Model initialization failed: ${error.message}`);
    }
};