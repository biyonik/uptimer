import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

/**
 * Enhanced Environment Variables Schema
 *
 * TR: Geliştirilmiş environment değişkenleri şeması. Güçlü validation,
 *     cross-field validation ve production-ready güvenlik kontrolleri.
 *
 * EN: Enhanced environment variables schema. Strong validation,
 *     cross-field validation and production-ready security checks.
 */
const envSchema = z.object({
    // ================================
    // 🌍 APPLICATION ENVIRONMENT
    // ================================
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string()
        .transform(Number)
        .pipe(z.number().min(1, 'Port must be greater than 0').max(65535, 'Port must be less than 65536'))
        .default('5000'),

    // ================================
    // 🗄️ DATABASE CONFIGURATION
    // ================================
    POSTGRES_DB: z.string()
        .url('Invalid PostgreSQL database URL format')
        .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
            message: 'Database URL must start with postgresql:// or postgres://'
        }),

    // ================================
    // 🔐 JWT & SECURITY
    // ================================
    JWT_TOKEN: z.string()
        .min(32, 'JWT token must be at least 32 characters for security')
        .max(512, 'JWT token is too long'),

    SECRET_KEY_ONE: z.string()
        .min(32, 'Secret key must be at least 32 characters for security')
        .max(256, 'Secret key is too long'),

    SECRET_KEY_TWO: z.string()
        .min(32, 'Secret key must be at least 32 characters for security')
        .max(256, 'Secret key is too long'),

    JWT_EXPIRES_IN: z.string()
        .regex(/^(\d+[smhd]|never)$/, 'JWT expires must be in format: 1s, 5m, 2h, 7d, or never')
        .default('7d'),

    BCRYPT_SALT_ROUNDS: z.string()
        .transform(Number)
        .pipe(z.number().min(10, 'Salt rounds must be at least 10 for security').max(15, 'Salt rounds too high, will be slow'))
        .default('12'),

    // ================================
    // 🛡️ RATE LIMITING & SECURITY
    // ================================
    RATE_LIMIT_MAX: z.string()
        .transform(Number)
        .pipe(z.number().positive('Rate limit must be positive').max(10000, 'Rate limit too high'))
        .default('100'),

    RATE_LIMIT_WINDOW_MS: z.string()
        .transform(Number)
        .pipe(z.number().positive('Rate limit window must be positive').max(3600000, 'Window cannot be more than 1 hour'))
        .default('900000'), // 15 minutes

    // ================================
    // 📧 EMAIL CONFIGURATION
    // ================================
    SENDER_EMAIL: z.string()
        .email('Invalid email format')
        .refine((email) => email.includes('@'), {
            message: 'Email must contain @ symbol'
        }),

    SENDER_EMAIL_PASSWORD: z.string()
        .min(1, 'Email password is required')
        .max(128, 'Email password is too long'),

    EMAIL_FROM_NAME: z.string()
        .min(1, 'Email from name is required')
        .max(100, 'Email from name is too long')
        .default('Uptimer App'),

    // ================================
    // 🌐 CLIENT & CORS
    // ================================
    CLIENT_URL: z.string()
        .url('Invalid client URL format')
        .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
            message: 'Client URL must start with http:// or https://'
        }),

    CORS_ORIGIN: z.string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            return val === '*' || z.string().url().safeParse(val).success;
        }, {
            message: 'CORS origin must be a valid URL or "*"'
        }),

    // ================================
    // 📊 LOGGING & MONITORING
    // ================================
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .default('info'),

    // ================================
    // 🔧 DEVELOPMENT SETTINGS
    // ================================
    GRAPHQL_INTROSPECTION: z.string()
        .transform((val) => val === 'true')
        .pipe(z.boolean())
        .default('true'),

    GRAPHQL_PLAYGROUND: z.string()
        .transform((val) => val === 'true')
        .pipe(z.boolean())
        .default('true'),

    ENABLE_QUERY_LOGGING: z.string()
        .transform((val) => val === 'true')
        .pipe(z.boolean())
        .default('true'),

    // ================================
    // ☁️ OPTIONAL EXTERNAL SERVICES
    // ================================
    REDIS_URL: z.string()
        .url('Invalid Redis URL format')
        .optional(),

    UPLOAD_MAX_FILE_SIZE: z.string()
        .transform(Number)
        .pipe(z.number().positive('Upload size must be positive').max(100 * 1024 * 1024, 'Upload size cannot exceed 100MB'))
        .default('10485760'), // 10MB default

    UPLOAD_ALLOWED_TYPES: z.string()
        .default('image/jpeg,image/png,image/gif,image/webp'),

    // Third-party services (optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    SENTRY_DSN: z.string().url('Invalid Sentry DSN URL').optional(),

}).refine((data) => {
    // TR: Production ortamında geliştirme ayarları kapalı olmalı
    // EN: Development settings should be disabled in production
    if (data.NODE_ENV === 'production') {
        return !data.GRAPHQL_INTROSPECTION && !data.GRAPHQL_PLAYGROUND;
    }
    return true;
}, {
    message: 'GraphQL introspection and playground must be disabled in production',
    path: ['NODE_ENV']
}).refine((data) => {
    // TR: Production'da CORS origin belirtilmeli
    // EN: CORS origin should be specified in production
    if (data.NODE_ENV === 'production') {
        return data.CORS_ORIGIN && data.CORS_ORIGIN !== '*';
    }
    return true;
}, {
    message: 'CORS origin must be specified and cannot be wildcard (*) in production',
    path: ['CORS_ORIGIN']
}).refine((data) => {
    // TR: Google OAuth için her iki key de gerekli
    // EN: Both Google OAuth keys are required if using Google auth
    if (data.GOOGLE_CLIENT_ID || data.GOOGLE_CLIENT_SECRET) {
        return data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET;
    }
    return true;
}, {
    message: 'Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google OAuth',
    path: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
});

/**
 * Parse and validate environment variables with enhanced error reporting
 *
 * TR: Environment değişkenlerini parse et ve detaylı hata raporlama ile validate et
 * EN: Parse and validate environment variables with detailed error reporting
 */
function parseEnv() {
    try {
        const parsed = envSchema.parse(process.env);

        // TR: Başarılı validation log'u
        // EN: Successful validation log
        console.log('✅ Environment variables validated successfully');

        return parsed;

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Environment validation failed:');
            console.error('================================');

            error.errors.forEach((err, index) => {
                console.error(`${index + 1}. ${err.path.join('.')}: ${err.message}`);
            });

            console.error('================================');
            console.error('💡 Please check your .env file and fix the above issues.');
            console.error('📖 Refer to .env.example for correct format.');

        } else {
            console.error('❌ Unexpected error during environment validation:', error);
        }

        process.exit(1);
    }
}

// Parse environment variables
const env = parseEnv();

/**
 * Strongly typed configuration object with enhanced structure
 *
 * TR: Güçlü tip kontrolü ile geliştirilmiş konfigürasyon objesi
 * EN: Strongly typed configuration object with enhanced structure
 */
export const config = {
    // ================================
    // 🌍 ENVIRONMENT
    // ================================
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    // ================================
    // 🗄️ DATABASE
    // ================================
    database: {
        url: env.POSTGRES_DB,
        // TR: Database URL'sinden host, port, db name çıkar
        // EN: Extract host, port, db name from database URL
        get host() {
            try {
                return new URL(env.POSTGRES_DB).hostname;
            } catch {
                return 'unknown';
            }
        },
        get port() {
            try {
                return new URL(env.POSTGRES_DB).port || '5432';
            } catch {
                return '5432';
            }
        },
        get name() {
            try {
                return new URL(env.POSTGRES_DB).pathname.slice(1);
            } catch {
                return 'unknown';
            }
        }
    },

    // ================================
    // 🔐 SECURITY & JWT
    // ================================
    jwt: {
        secret: env.JWT_TOKEN,
        secretKeyOne: env.SECRET_KEY_ONE,
        secretKeyTwo: env.SECRET_KEY_TWO,
        expiresIn: env.JWT_EXPIRES_IN,
    },

    security: {
        bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
        rateLimit: {
            max: env.RATE_LIMIT_MAX,
            windowMs: env.RATE_LIMIT_WINDOW_MS,
            // TR: Dakika cinsinden window hesapla
            // EN: Calculate window in minutes
            get windowMinutes() {
                return Math.round(env.RATE_LIMIT_WINDOW_MS / (1000 * 60));
            }
        }
    },

    // ================================
    // 📧 EMAIL
    // ================================
    email: {
        sender: env.SENDER_EMAIL,
        password: env.SENDER_EMAIL_PASSWORD,
        fromName: env.EMAIL_FROM_NAME,
        // TR: Email domain'ini çıkar
        // EN: Extract email domain
        get domain() {
            return env.SENDER_EMAIL.split('@')[1] || 'unknown';
        }
    },

    // ================================
    // 🌐 CLIENT & CORS
    // ================================
    client: {
        url: env.CLIENT_URL,
        corsOrigin: env.CORS_ORIGIN || env.CLIENT_URL,
        // TR: Client URL'sinden host çıkar
        // EN: Extract host from client URL
        get host() {
            try {
                return new URL(env.CLIENT_URL).hostname;
            } catch {
                return 'localhost';
            }
        },
        get protocol() {
            try {
                return new URL(env.CLIENT_URL).protocol;
            } catch {
                return 'http:';
            }
        }
    },

    // ================================
    // 📊 LOGGING
    // ================================
    server: {
        logLevel: env.LOG_LEVEL,
        enableQueryLogging: env.ENABLE_QUERY_LOGGING,
    },

    // ================================
    // 🎮 GRAPHQL SETTINGS
    // ================================
    graphql: {
        introspection: env.GRAPHQL_INTROSPECTION,
        playground: env.GRAPHQL_PLAYGROUND,
        endpoint: '/graphql',
        // TR: GraphQL URL'ini oluştur
        // EN: Generate GraphQL URL
        get playgroundUrl() {
            return env.GRAPHQL_PLAYGROUND ? `http://localhost:${env.PORT}/graphql` : null;
        }
    },

    // ================================
    // 📁 FILE UPLOAD
    // ================================
    upload: {
        maxFileSize: env.UPLOAD_MAX_FILE_SIZE,
        allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim()),
        // TR: Max file size'ı MB cinsinden hesapla
        // EN: Calculate max file size in MB
        get maxFileSizeMB() {
            return Math.round(env.UPLOAD_MAX_FILE_SIZE / (1024 * 1024));
        }
    },

    // ================================
    // ☁️ EXTERNAL SERVICES
    // ================================
    external: {
        redis: {
            url: env.REDIS_URL,
            enabled: !!env.REDIS_URL
        },
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
        },
        sentry: {
            dsn: env.SENTRY_DSN,
            enabled: !!env.SENTRY_DSN
        }
    },

    // ================================
    // 🚩 FEATURE FLAGS
    // ================================
    features: {
        enableGraphQLPlayground: env.GRAPHQL_PLAYGROUND && env.NODE_ENV === 'development',
        enableCors: true,
        enableRateLimit: env.NODE_ENV === 'production',
        enableRedis: !!env.REDIS_URL,
        enableGoogleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        enableSentry: !!env.SENTRY_DSN,
        enableFileUpload: true,
        enableQueryLogging: env.ENABLE_QUERY_LOGGING && env.NODE_ENV === 'development'
    }
} as const;

/**
 * Configuration type for TypeScript
 */
export type Config = typeof config;

/**
 * Enhanced configuration validation with detailed logging
 *
 * TR: Detaylı loglama ile geliştirilmiş konfigürasyon validasyonu
 * EN: Enhanced configuration validation with detailed logging
 */
export function validateConfig(): void {
    console.log('✅ Configuration validated successfully');
    console.log('=====================================');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🌐 Server: ${config.client.protocol}//${config.client.host}:${config.PORT}`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`📧 Email: ${config.email.sender} (${config.email.domain})`);
    console.log(`🛡️ Rate Limit: ${config.security.rateLimit.max} requests per ${config.security.rateLimit.windowMinutes} minutes`);
    console.log(`🎮 GraphQL Playground: ${config.features.enableGraphQLPlayground ? 'enabled' : 'disabled'}`);
    console.log(`📁 Upload: Max ${config.upload.maxFileSizeMB}MB, Types: ${config.upload.allowedTypes.length}`);

    // TR: External services durumu
    // EN: External services status
    const enabledServices = Object.entries(config.external)
        .filter(([_, service]) => service.enabled)
        .map(([name]) => name);

    if (enabledServices.length > 0) {
        console.log(`☁️ External Services: ${enabledServices.join(', ')}`);
    }

    console.log('=====================================');
}

/**
 * Environment Variables Type Export
 */
export type Env = z.infer<typeof envSchema>;

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