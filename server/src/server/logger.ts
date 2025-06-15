import pino from 'pino';
import { config } from "@app/server/config";

// TR: Logger instance oluştur
// EN: Create logger instance
const logger = pino({
    level: config.server?.logLevel || (config.isProduction ? 'info' : 'debug'),
    transport: config.isDevelopment ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    } : undefined
});

// TR: Default export
// EN: Default export
export default logger;

// TR: Typed logger helpers - logger instance'ından sonra
// EN: Typed logger helpers - after logger instance
export const createContextLogger = (context: string) => {
    return logger.child({ context });
};

// TR: GraphQL logger
// EN: GraphQL logger
export const graphqlLogger = createContextLogger('GraphQL');

// TR: Database logger
// EN: Database logger
export const dbLogger = createContextLogger('Database');