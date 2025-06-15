import logger from "@app/server/logger";
import {config} from "@app/server/config";
import {NotificationModel, UserModel } from ".";

export const initializeModels = async (): Promise<void> => {
    try {
        logger.info('Initializing models...');

        if (config.isDevelopment) {
            await UserModel.sync({ alter: true });
            await NotificationModel.sync({ alter: true });
            logger.info('Models synchronized successfully');
        }

        logger.info('Models initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize models:', { error });
        throw error;
    }
};