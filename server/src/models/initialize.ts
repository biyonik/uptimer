import logger from "@app/server/logger";
import {config} from "@app/server/config";
import {NotificationModel, UserModel } from ".";

/**
 * Initialize all models and associations - WITH SAFETY CHECK
 *
 * TR: Tüm model'leri ve association'ları initialize et. Çift sync'i önle.
 * EN: Initialize all models and associations. Prevent double sync.
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


        // TR: Model'leri sync et (sadece development'ta)
        // EN: Sync models (only in development)
        if (config.isDevelopment) {
            await UserModel.sync({ alter: true, force: true });
            await NotificationModel.sync({ alter: true, force: true });
            logger.info('Models synchronized successfully');
        }

        modelsInitialized = true;
        logger.info('Models initialized successfully');

    } catch (error) {
        logger.error('Failed to initialize models:', { error });
        throw new Error('Model initialization failed');
    }
};