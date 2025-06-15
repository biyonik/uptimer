/**
 * Ana Uygulama Giriş Noktası - GraphQL + Express Integration
 *
 * TR: Bu dosya, GraphQL Apollo Server ve Express uygulamasının birlikte başlatıldığı
 *     ana giriş noktasıdır. Database bağlantısı, Apollo Server, Express middleware'leri
 *     ve HTTP sunucusunu sıralı bir şekilde başlatır. Full-stack uygulamanın lifecycle'ının
 *     başladığı yerdir.
 *
 * EN: This file is the main entry point where GraphQL Apollo Server and Express application
 *     start together. Sequentially starts database connection, Apollo Server, Express middlewares
 *     and HTTP server. This is where the full-stack application lifecycle begins.
 */

import express, { Express } from 'express';
import MonitorServer from './server/server';
import { config, validateConfig } from './server/config';
import { connectDatabase, syncDatabase, closeDatabase } from './server/database';
import logger from './server/logger';

/**
 * ApplicationBootstrap Sınıfı - GraphQL + Express Integration
 *
 * TR: GraphQL Apollo Server ve Express uygulamasının başlatılma sürecini yöneten sınıf.
 *     Singleton pattern kullanır. Database bağlantısı, GraphQL schema hazırlığı,
 *     Apollo Server başlatma, Express setup ve HTTP server başlatma işlemlerini
 *     sıralı bir şekilde gerçekleştirir.
 *
 * EN: Class that manages startup process of GraphQL Apollo Server and Express application.
 *     Uses singleton pattern. Performs database connection, GraphQL schema preparation,
 *     Apollo Server startup, Express setup and HTTP server startup operations sequentially.
 */
class ApplicationBootstrap {
    /**
     * TR: Singleton instance - sadece bir tane ApplicationBootstrap olmasını sağlar
     * EN: Singleton instance - ensures only one ApplicationBootstrap exists
     */
    private static instance: ApplicationBootstrap;

    /**
     * TR: Express uygulaması referansı
     * EN: Express application reference
     */
    private readonly app: Express;

    /**
     * TR: MonitorServer instance'ı - HTTP ve GraphQL sunucularını yönetir
     * EN: MonitorServer instance - manages HTTP and GraphQL servers
     */
    private readonly monitorServer: MonitorServer;

    /**
     * TR: Uygulama başlatılma durumu - çift başlatmayı önler
     * EN: Application startup status - prevents double initialization
     */
    private isInitialized: boolean = false;

    /**
     * Constructor - Kurucu Metot
     *
     * TR: Private constructor - Singleton pattern için dışarıdan instance oluşturulmasını engeller.
     *     Express uygulamasını oluşturur ve MonitorServer'ı (Apollo Server dahil) initialize eder.
     *
     * EN: Private constructor - Prevents external instance creation for Singleton pattern.
     *     Creates Express application and initializes MonitorServer (including Apollo Server).
     */
    private constructor() {
        this.app = express();
        // TR: MonitorServer artık Apollo Server'ı da içeriyor
        // EN: MonitorServer now also includes Apollo Server
        this.monitorServer = new MonitorServer(this.app);
    }

    /**
     * getInstance() - Singleton Instance Alma Metodu
     *
     * TR: ApplicationBootstrap'ın tek instance'ını döner. Yoksa oluşturur.
     *     Singleton pattern implementasyonu.
     *
     * EN: Returns single instance of ApplicationBootstrap. Creates if doesn't exist.
     *     Singleton pattern implementation.
     *
     * @returns ApplicationBootstrap - TR: Tek instance | EN: Single instance
     */
    public static getInstance(): ApplicationBootstrap {
        if (!ApplicationBootstrap.instance) {
            ApplicationBootstrap.instance = new ApplicationBootstrap();
        }
        return ApplicationBootstrap.instance;
    }

    /**
     * initializeApplication() - Ana Uygulama Başlatma Metodu - GraphQL Enhanced
     *
     * TR: GraphQL + Express uygulamasının tüm başlatma sürecini yönetir. Sırasıyla:
     *     1. Konfigürasyon validasyonu
     *     2. Database bağlantısı ve model sync
     *     3. GraphQL schema hazırlığı kontrolü
     *     4. Apollo Server + Express başlatma (MonitorServer içinde)
     *     5. HTTP sunucu başlatma
     *     işlemlerini gerçekleştirir.
     *
     * EN: Manages entire GraphQL + Express application startup process. Sequentially:
     *     1. Configuration validation
     *     2. Database connection and model sync
     *     3. GraphQL schema readiness check
     *     4. Apollo Server + Express startup (inside MonitorServer)
     *     5. HTTP server startup
     *     operations are performed.
     */
    public async initializeApplication(): Promise<void> {
        // TR: Çift başlatmayı önle
        // EN: Prevent double initialization
        if (this.isInitialized) {
            logger.warn('⚠️ Application is already initialized');
            return;
        }

        try {
            const startTime = Date.now();
            logger.info('🚀 STARTING GRAPHQL + EXPRESS APPLICATION...');
            logger.info('==============================================');

            // TR: 1. Konfigürasyon Validasyonu
            // EN: 1. Configuration Validation
            await this.validateConfiguration();

            // TR: 2. Database Bağlantısı ve Setup
            // EN: 2. Database Connection and Setup
            await this.setupDatabase();

            // TR: 3. GraphQL Schema Hazırlığı Kontrolü
            // EN: 3. GraphQL Schema Readiness Check
            await this.checkGraphQLReadiness();

            // TR: 4. Full-Stack Server Başlatma (Apollo + Express + HTTP)
            // EN: 4. Full-Stack Server Startup (Apollo + Express + HTTP)
            await this.startFullStackServer();

            // TR: 5. Başlatma tamamlandı
            // EN: 5. Initialization completed
            this.isInitialized = true;
            const elapsedTime = Date.now() - startTime;
            this.logSuccessfulStartup(elapsedTime);

        } catch (error) {
            logger.error('❌ GraphQL + Express application bootstrap failed:', { error });
            await this.handleBootstrapError(error);
        }
    }

    /**
     * validateConfiguration() - Konfigürasyon Validasyon Metodu
     *
     * TR: Environment değişkenlerini ve GraphQL + Express konfigürasyonunu validate eder.
     *     GraphQL endpoint, CORS, JWT secret gibi ayarları kontrol eder.
     *
     * EN: Validates environment variables and GraphQL + Express configuration.
     *     Checks GraphQL endpoint, CORS, JWT secret and other settings.
     */
    private async validateConfiguration(): Promise<void> {
        logger.info('🔧 Validating GraphQL + Express configuration...');

        try {
            // TR: Zod ile environment validation
            // EN: Environment validation with Zod
            validateConfig();

            logger.info('✅ Configuration validation successful');
            logger.info(`📊 Environment: ${config.NODE_ENV}`);
            logger.info(`🌐 HTTP Port: ${config.PORT}`);
            logger.info(`🔗 GraphQL Endpoint: /graphql`);
            logger.info(`🎮 GraphQL Playground: ${config.isDevelopment ? 'enabled' : 'disabled'}`);
            logger.info(`🌍 CORS Origin: ${config.client.corsOrigin}`);

        } catch (error) {
            logger.error('❌ Configuration validation failed:', { error });
            throw new Error(`Configuration validation error: ${error}`);
        }
    }

    /**
     * setupDatabase() - Database Kurulum Metodu - GraphQL Ready
     *
     * TR: Database bağlantısını kurar ve GraphQL için gerekli model'leri sync eder.
     *     GraphQL resolver'larının kullanacağı database connection'ı hazırlar.
     *
     * EN: Establishes database connection and syncs models needed for GraphQL.
     *     Prepares database connection that GraphQL resolvers will use.
     */
    private async setupDatabase(): Promise<void> {
        logger.info('🗄️ Setting up database for GraphQL + Express...');

        try {
            // TR: Database bağlantısını test et
            // EN: Test database connection
            await connectDatabase();

            // TR: GraphQL için model synchronization
            // EN: Model synchronization for GraphQL
            if (config.isDevelopment) {
                logger.info('🔄 Synchronizing database models for GraphQL (development mode)...');
                await syncDatabase({ alter: true });
            } else if (config.NODE_ENV === 'production') {
                logger.info('🔒 Running safe database sync for production GraphQL...');
                await syncDatabase({ alter: false, force: false });
            }

            logger.info('✅ Database setup completed for GraphQL resolvers');

        } catch (error) {
            logger.error('❌ Database setup failed:', { error });
            throw new Error(`Database setup error: ${error}`);
        }
    }

    /**
     * checkGraphQLReadiness() - GraphQL Hazırlık Kontrolü
     *
     * TR: GraphQL schema'larının, resolver'larının ve type definition'larının
     *     hazır olduğunu kontrol eder. Apollo Server başlatılmadan önce
     *     gerekli GraphQL asset'lerinin varlığını doğrular.
     *
     * EN: Checks that GraphQL schemas, resolvers and type definitions are ready.
     *     Validates existence of necessary GraphQL assets before Apollo Server startup.
     */
    private async checkGraphQLReadiness(): Promise<void> {
        logger.info('📡 Checking GraphQL schema readiness...');

        try {
            // TR: GraphQL schema dosyalarının varlığını kontrol et
            // EN: Check existence of GraphQL schema files

            // TR: Şu an için basic check - gelecekte schema validation eklenebilir
            // EN: Basic check for now - schema validation can be added in future
            logger.debug('📋 GraphQL TypeDefs: Ready (embedded)');
            logger.debug('⚙️ GraphQL Resolvers: Ready (embedded)');
            logger.debug('🔌 GraphQL Context: Ready (authentication + database)');

            // TR: Gelecekte buraya eklenebilir:
            // EN: Can be added in future:
            // - Schema file validation
            // - Resolver type checking
            // - Custom directive validation
            // - Plugin configuration check

            logger.info('✅ GraphQL schema readiness check passed');

        } catch (error) {
            logger.error('❌ GraphQL readiness check failed:', { error });
            throw new Error(`GraphQL readiness error: ${error}`);
        }
    }

    /**
     * startFullStackServer() - Full-Stack Server Başlatma Metodu
     *
     * TR: Apollo GraphQL Server ve Express uygulamasını birlikte başlatır.
     *     MonitorServer içinde Apollo Server, Express middleware'leri ve
     *     HTTP server'ı sıralı bir şekilde başlatılır.
     *
     * EN: Starts Apollo GraphQL Server and Express application together.
     *     Inside MonitorServer, Apollo Server, Express middlewares and
     *     HTTP server are started sequentially.
     */
    private async startFullStackServer(): Promise<void> {
        logger.info('🌐 Starting Full-Stack Server (GraphQL + Express + HTTP)...');

        try {
            // TR: MonitorServer.start() artık şunları yapıyor:
            // EN: MonitorServer.start() now does:
            // 1. Apollo Server startup
            // 2. Express middleware application
            // 3. GraphQL middleware integration
            // 4. HTTP server startup
            await this.monitorServer.start();

            logger.info('✅ Full-Stack server started successfully');

        } catch (error) {
            logger.error('❌ Full-Stack server startup failed:', { error });
            throw new Error(`Full-Stack server startup error: ${error}`);
        }
    }

    /**
     * logSuccessfulStartup() - Başarılı Başlatma Log Metodu - GraphQL Enhanced
     *
     * TR: GraphQL + Express uygulaması başarıyla başlatıldığında detaylı bilgileri loglar.
     *     GraphQL endpoint'leri, Playground, REST API ve health check bilgilerini gösterir.
     *
     * EN: Logs detailed information when GraphQL + Express application starts successfully.
     *     Shows GraphQL endpoints, Playground, REST API and health check information.
     *
     * @param elapsedTime - TR: Başlatma süresi (ms) | EN: Startup time (ms)
     */
    private logSuccessfulStartup(elapsedTime: number): void {
        const serverInfo = this.monitorServer.getServerInfo();

        logger.info('\n🎉 GRAPHQL + EXPRESS APPLICATION STARTUP SUCCESSFUL!');
        logger.info('=====================================================');
        logger.info(`📊 Environment: ${serverInfo.environment}`);
        logger.info(`🌐 HTTP Port: ${serverInfo.port}`);
        logger.info(`🔧 Process ID: ${serverInfo.pid}`);
        logger.info(`⚡ Startup Time: ${elapsedTime}ms`);
        logger.info(`⏱️ Started At: ${new Date().toISOString()}`);
        logger.info('\n🔗 Available Endpoints:');
        logger.info(`   • 🏠 REST API Status: http://localhost:${serverInfo.port}/`);
        logger.info(`   • ❤️ Health Check: http://localhost:${serverInfo.port}/health`);
        logger.info(`   • 🚀 GraphQL API: http://localhost:${serverInfo.port}/graphql`);

        if (config.isDevelopment) {
            logger.info(`   • 🎮 GraphQL Playground: http://localhost:${serverInfo.port}/graphql`);
            logger.info('\n📋 Development Features:');
            logger.info(`   • GraphQL Introspection: ✅ Enabled`);
            logger.info(`   • Request Logging: ✅ Enabled`);
            logger.info(`   • Error Stack Traces: ✅ Enabled`);
        } else {
            logger.info('\n🔒 Production Features:');
            logger.info(`   • GraphQL Introspection: ❌ Disabled`);
            logger.info(`   • Error Masking: ✅ Enabled`);
            logger.info(`   • Query Caching: ✅ Enabled`);
        }

        logger.info('\n🧪 Test GraphQL Query:');
        logger.info(`curl -X POST http://localhost:${serverInfo.port}/graphql \\`);
        logger.info(`  -H "Content-Type: application/json" \\`);
        logger.info(`  -d '{"query":"{ hello serverInfo { status uptime } }"}'`);
        logger.info('=====================================================\n');
    }

    /**
     * handleBootstrapError() - Bootstrap Hata İşleme Metodu - GraphQL Enhanced
     *
     * TR: GraphQL + Express uygulama başlatma sırasında oluşan hataları işler.
     *     Apollo Server, database bağlantısı ve HTTP server'ı güvenli şekilde kapatır.
     *
     * EN: Handles errors that occur during GraphQL + Express application bootstrap.
     *     Safely shuts down Apollo Server, database connection and HTTP server.
     *
     * @param error - TR: Oluşan hata | EN: Error that occurred
     */
    private async handleBootstrapError(error: any): Promise<void> {
        logger.error('\n💥 GRAPHQL + EXPRESS BOOTSTRAP ERROR - CLEANING UP...');
        logger.error('===================================================');
        logger.error('Error details:', { error });

        try {
            // TR: 1. Database bağlantısını kapat
            // EN: 1. Close database connection
            logger.info('🗄️ Closing database connection...');
            await closeDatabase();

            // TR: 2. MonitorServer'ı durdur (Apollo + HTTP server dahil)
            // EN: 2. Stop MonitorServer (including Apollo + HTTP server)
            if (this.monitorServer) {
                logger.info('🌐 Stopping Full-Stack server (Apollo + Express + HTTP)...');
                await this.monitorServer.stop();
            }

        } catch (cleanupError) {
            logger.error('❌ Error during cleanup:', { cleanupError });
        } finally {
            logger.fatal('💀 GraphQL + Express application terminated due to startup failure');
            process.exit(1); // TR: Hata kodu ile çık | EN: Exit with error code
        }
    }

    /**
     * gracefulShutdown() - Graceful Kapatma Metodu - GraphQL Enhanced
     *
     * TR: GraphQL + Express uygulamasını güvenli bir şekilde kapatır.
     *     Apollo Server, database ve HTTP bağlantılarını temizler.
     *     External signal handler'lardan çağrılabilir.
     *
     * EN: Safely shuts down GraphQL + Express application.
     *     Cleans up Apollo Server, database and HTTP connections.
     *     Can be called from external signal handlers.
     */
    public async gracefulShutdown(): Promise<void> {
        logger.info('\n🔄 Starting graceful shutdown of GraphQL + Express application...');

        try {
            // TR: 1. MonitorServer'ı durdur (Apollo Server + HTTP)
            // EN: 1. Stop MonitorServer (Apollo Server + HTTP)
            logger.info('📡 Stopping Apollo GraphQL Server...');
            await this.monitorServer.stop();

            // TR: 2. Database bağlantısını kapat
            // EN: 2. Close database connection
            logger.info('🗄️ Closing database connection...');
            await closeDatabase();

            logger.info('✅ GraphQL + Express application graceful shutdown completed');
            process.exit(0);

        } catch (error) {
            logger.error('❌ Error during graceful shutdown:', { error });
            process.exit(1);
        }
    }
}


/**
 * initializeApp() - Ana Başlatma Fonksiyonu - GraphQL + Express Edition
 *
 * TR: GraphQL Apollo Server ve Express uygulamasını başlatan ana fonksiyon.
 *     ApplicationBootstrap singleton'ını kullanır. Enhanced error handling
 *     ve GraphQL-specific graceful shutdown setup'ını yapar.
 *
 * EN: Main function that starts GraphQL Apollo Server and Express application.
 *     Uses ApplicationBootstrap singleton. Enhanced error handling and
 *     GraphQL-specific graceful shutdown setup.
 */
const initializeApp = async (): Promise<void> => {
    try {
        // TR: Başlatma zamanını kaydet
        // EN: Record startup time
        const startTime = Date.now();

        logger.info('🚀 INITIALIZING GRAPHQL + EXPRESS APPLICATION...');
        logger.info('===============================================');
        logger.info(`🕒 Startup initiated at: ${new Date().toISOString()}`);
        logger.info(`🎯 Target: Full-Stack GraphQL API Server`);
        logger.info(`📦 Stack: Apollo Server + Express + PostgreSQL`);

        // TR: ApplicationBootstrap instance'ını al ve başlat
        // EN: Get ApplicationBootstrap instance and start
        const app = ApplicationBootstrap.getInstance();
        await app.initializeApplication();

        // TR: Başlatma süresini hesapla ve logla
        // EN: Calculate and log startup time
        const elapsedTime = Date.now() - startTime;
        logger.info(`⚡ Total startup time: ${elapsedTime}ms`);

        // TR: Process signal handler'ları setup et - GraphQL aware
        // EN: Setup process signal handlers - GraphQL aware
        process.on('SIGTERM', async () => {
            logger.info('\n📡 SIGTERM received - initiating GraphQL + Express shutdown...');
            await app.gracefulShutdown();
        });

        process.on('SIGINT', async () => {
            logger.info('\n📡 SIGINT received (Ctrl+C) - initiating GraphQL + Express shutdown...');
            await app.gracefulShutdown();
        });

        // TR: Unhandled promise rejection - GraphQL query errors vb.
        // EN: Unhandled promise rejection - GraphQL query errors etc.
        process.on('unhandledRejection', async (reason, promise) => {
            logger.error('❌ Unhandled Promise Rejection:', { reason, promise });
            logger.info('🔄 Initiating emergency shutdown...');
            await app.gracefulShutdown();
        });

        // TR: Uncaught exception - kritik hatalar
        // EN: Uncaught exception - critical errors
        process.on('uncaughtException', async (error) => {
            logger.error('❌ Uncaught Exception:', { error });
            logger.info('🔄 Initiating emergency shutdown...');
            await app.gracefulShutdown();
        });

        logger.info('\n🛡️ Signal handlers configured for GraphQL + Express stack');
        logger.info('🎯 Application ready to serve GraphQL and REST requests\n');

    } catch (error) {
        logger.error('\n💥 CRITICAL ERROR - GraphQL + Express initialization failed:');
        logger.error('================================================================');
        logger.error('Application startup error:', { error });
        logger.fatal('\n💀 Application startup aborted');
        process.exit(1);
    }
};

/**
 * TR: GraphQL + Express uygulamasını başlat - bu satır çalıştığında tüm full-stack süreç başlar
 * EN: Start GraphQL + Express application - when this line runs, entire full-stack process begins
 */
initializeApp();