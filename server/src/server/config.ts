import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

/**
 * Environment variables schema with validation rules
 */
const envSchema = z.object({
    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('5000'),

    // Database
    POSTGRES_DB: z.string().url('Invalid database URL format'),

    // JWT & Security
    JWT_TOKEN: z.string().min(32, 'JWT token must be at least 32 characters'),
    SECRET_KEY_ONE: z.string().min(16, 'Secret key must be at least 16 characters'),
    SECRET_KEY_TWO: z.string().min(16, 'Secret key must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Email
    SENDER_EMAIL: z.string().email('Invalid email format'),
    SENDER_EMAIL_PASSWORD: z.string().min(1, 'Email password is required'),

    // Client
    CLIENT_URL: z.string().url('Invalid client URL format'),

    // Optional configurations
    CORS_ORIGIN: z.string().optional(),
    RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).default('100'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach((err) => {
                console.error(`  • ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            console.error('❌ Unexpected error during environment validation:', error);
        }
        process.exit(1);
    }
}

// Parse environment variables
const env = parseEnv();

/**
 * Strongly typed configuration object
 */
export const config = {
    // Environment
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    // Database
    database: {
        url: env.POSTGRES_DB,
    },

    // JWT & Security
    jwt: {
        secret: env.JWT_TOKEN,
        secretKeyOne: env.SECRET_KEY_ONE,
        secretKeyTwo: env.SECRET_KEY_TWO,
        expiresIn: env.JWT_EXPIRES_IN,
    },

    // Email
    email: {
        sender: env.SENDER_EMAIL,
        password: env.SENDER_EMAIL_PASSWORD,
    },

    // Client
    client: {
        url: env.CLIENT_URL,
        corsOrigin: env.CORS_ORIGIN || env.CLIENT_URL,
    },

    // Server settings
    server: {
        rateLimit: {
            max: env.RATE_LIMIT_MAX,
            windowMs: 15 * 60 * 1000, // 15 minutes
        },
        logLevel: env.LOG_LEVEL,
    },

    // Feature flags
    features: {
        enableGraphQLPlayground: !env.NODE_ENV || env.NODE_ENV === 'development',
        enableCors: true,
        enableRateLimit: env.NODE_ENV === 'production',
    }
} as const;

/**
 * Type for the configuration object
 */
export type Config = typeof config;

/**
 * Validate configuration and log startup info
 */
export function validateConfig(): void {
    console.log('✅ Configuration validated successfully');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🚀 Server will start on port: ${config.PORT}`);
    console.log(`🎮 GraphQL Playground: ${config.features.enableGraphQLPlayground ? 'enabled' : 'disabled'}`);
    console.log(`📧 Email sender: ${config.email.sender}`);
    console.log(`🌐 Client URL: ${config.client.url}`);
}

// Export individual values for backward compatibility
export const {
    NODE_ENV,
    PORT,
    database: { url: POSTGRES_DB },
    jwt: {
        secret: JWT_TOKEN,
        secretKeyOne: SECRET_KEY_ONE,
        secretKeyTwo: SECRET_KEY_TWO
    },
    email: {
        sender: SENDER_EMAIL,
        password: SENDER_EMAIL_PASSWORD
    },
    client: { url: CLIENT_URL }
} = config;