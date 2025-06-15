import { Sequelize } from "sequelize";
import { config } from "./config";

/**
 * Sequelize instance with PostgreSQL connection
 */
export const sequelize: Sequelize = new Sequelize(config.database.url, {
    // Database dialect
    dialect: 'postgres',

    // Connection pool configuration
    pool: {
        max: 10,        // Maximum number of connections
        min: 0,         // Minimum number of connections
        acquire: 30000, // Maximum time to get connection (ms)
        idle: 10000,    // Maximum time connection can be idle (ms)
    },

    // Logging configuration
    logging: config.isDevelopment ? console.log : false,

    // Query options
    define: {
        timestamps: true,        // Add createdAt and updatedAt
        underscored: true,       // Use snake_case for column names
        freezeTableName: true,   // Don't pluralize table names
    },

    // Timezone configuration
    timezone: '+00:00', // UTC timezone

    // SSL configuration for production
    dialectOptions: config.isProduction ? {
        multipleStatements: true, // Allow multiple statements in a single query
        ssl: {
            require: true,
            rejectUnauthorized: false, // For services like Heroku
        },
    } : {
        multipleStatements: true, // Allow multiple statements in a single query
    },

    // Retry configuration
    retry: {
        max: 3, // Maximum retry attempts
    },
});

/**
 * Test database connection
 */
export async function connectDatabase(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');

        if (config.isDevelopment) {
            console.log(`📊 Database URL: ${config.database.url.replace(/\/\/.*@/, '//***:***@')}`);
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

/**
 * Sync database models (use carefully in production)
 */
export async function syncDatabase(options: { force?: boolean; alter?: boolean } = {}): Promise<void> {
    try {
        if (config.isProduction && options.force) {
            throw new Error('Cannot use force sync in production environment');
        }

        await sequelize.sync({
            force: options.force || false,     // Drop tables and recreate
            alter: options.alter || config.isDevelopment, // Alter tables to match models
        });

        console.log('✅ Database synchronized successfully');
    } catch (error) {
        console.error('❌ Database synchronization failed:', error);
        throw error;
    }
}

/**
 * Close database connection gracefully
 */
export async function closeDatabase(): Promise<void> {
    try {
        await sequelize.close();
        console.log('✅ Database connection closed successfully');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
}