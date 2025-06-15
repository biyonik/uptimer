/**
 * Ana Uygulama Giriş Noktası (Main Application Entry Point)
 *
 * TR: Bu dosya, tüm uygulamanın başlatıldığı ana giriş noktasıdır.
 *     Express uygulamasını oluşturur, MonitorServer ile HTTP sunucusunu başlatır
 *     ve gerekli error handling'i sağlar. Uygulama lifecycle'ının başladığı yerdir.
 *
 * EN: This file is the main entry point where the entire application starts.
 *     Creates Express application, starts HTTP server with MonitorServer
 *     and provides necessary error handling. This is where application lifecycle begins.
 */

import express, {Express, NextFunction, Request, Response} from 'express';
import MonitorServer from './server/server';
import { config, validateConfig } from './server/config'
import { connectDatabase, syncDatabase, closeDatabase } from './server/database';

/**
 * ApplicationBootstrap Sınıfı
 *
 * TR: Uygulamanın başlatılma sürecini yöneten sınıf. Singleton pattern kullanır.
 *     Database bağlantısı, konfigürasyon validasyonu, Express setup ve server başlatma
 *     işlemlerini sıralı bir şekilde gerçekleştirir.
 *
 * EN: Class that manages application bootstrap process. Uses singleton pattern.
 *     Performs database connection, config validation, Express setup and server startup
 *     operations in a sequential manner.
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
     * TR: MonitorServer instance'ı - HTTP sunucusunu yönetir
     * EN: MonitorServer instance - manages HTTP server
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
     *     Express uygulamasını oluşturur ve MonitorServer'ı initialize eder.
     *
     * EN: Private constructor - Prevents external instance creation for Singleton pattern.
     *     Creates Express application and initializes MonitorServer.
     */
    private constructor() {
        this.app = express();
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
     * initializeApplication() - Ana Uygulama Başlatma Metodu
     *
     * TR: Uygulamanın tüm başlatma sürecini yönetir. Sırasıyla:
     *     1. Konfigürasyon validasyonu
     *     2. Database bağlantısı
     *     3. Database model senkronizasyonu
     *     4. Express middleware setup
     *     5. HTTP sunucu başlatma
     *     işlemlerini gerçekleştirir.
     *
     * EN: Manages entire application startup process. Sequentially:
     *     1. Configuration validation
     *     2. Database connection
     *     3. Database model synchronization
     *     4. Express middleware setup
     *     5. HTTP server startup
     *     operations are performed.
     */
    public async initializeApplication(): Promise<void> {
        // TR: Çift başlatmayı önle
        // EN: Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ Application is already initialized');
            return;
        }

        try {
            console.log('🚀 Starting application bootstrap process...');

            // TR: 1. Konfigürasyon Validasyonu
            // EN: 1. Configuration Validation
            await this.validateConfiguration();

            // TR: 2. Database Bağlantısı
            // EN: 2. Database Connection
            await this.setupDatabase();

            // TR: 3. Express Uygulaması Konfigürasyonu
            // EN: 3. Express Application Configuration
            await this.configureExpress();

            // TR: 4. HTTP Sunucu Başlatma
            // EN: 4. HTTP Server Startup
            await this.startServer();

            // TR: 5. Başlatma tamamlandı
            // EN: 5. Initialization completed
            this.isInitialized = true;
            this.logSuccessfulStartup();

        } catch (error) {
            console.error('❌ Application bootstrap failed:', error);
            await this.handleBootstrapError(error);
        }
    }

    /**
     * validateConfiguration() - Konfigürasyon Validasyon Metodu
     *
     * TR: Environment değişkenlerini ve uygulama konfigürasyonunu validate eder.
     *     Gerekli değişkenlerin varlığını ve formatını kontrol eder.
     *
     * EN: Validates environment variables and application configuration.
     *     Checks existence and format of required variables.
     */
    private async validateConfiguration(): Promise<void> {
        console.log('🔧 Validating application configuration...');

        try {
            // TR: Zod ile environment validation
            // EN: Environment validation with Zod
            validateConfig();

            console.log('✅ Configuration validation successful');
            console.log(`📊 Environment: ${config.NODE_ENV}`);
            console.log(`🌐 Target Port: ${config.PORT}`);

        } catch (error) {
            console.error('❌ Configuration validation failed:', error);
            throw new Error(`Configuration validation error: ${error}`);
        }
    }

    /**
     * setupDatabase() - Database Kurulum Metodu
     *
     * TR: Database bağlantısını kurar ve gerekirse model senkronizasyonu yapar.
     *     Development ortamında model'leri otomatik sync eder.
     *     Production'da dikkatli sync yapar.
     *
     * EN: Establishes database connection and synchronizes models if needed.
     *     Auto-syncs models in development environment.
     *     Careful sync in production.
     */
    private async setupDatabase(): Promise<void> {
        console.log('🗄️ Setting up database connection...');

        try {
            // TR: Database bağlantısını test et
            // EN: Test database connection
            await connectDatabase();

            // TR: Development ortamında model sync
            // EN: Model sync in development environment
            if (config.isDevelopment) {
                console.log('🔄 Synchronizing database models (development mode)...');
                await syncDatabase({ alter: true });
            } else if (config.NODE_ENV === 'production') {
                // TR: Production'da sadece safe sync
                // EN: Only safe sync in production
                console.log('🔒 Running safe database sync (production mode)...');
                await syncDatabase({ alter: false, force: false });
            }

            console.log('✅ Database setup completed');

        } catch (error) {
            console.error('❌ Database setup failed:', error);
            throw new Error(`Database setup error: ${error}`);
        }
    }

    /**
     * configureExpress() - Fixed Express Konfigürasyon Metodu
     *
     * TR: Express uygulamasına gerekli middleware'leri ve route'ları ekler.
     *     JSON parsing, CORS, security headers, API routes vb. konfigürasyonları yapar.
     *     path-to-regexp hatası için wildcard route'u düzeltildi.
     *
     * EN: Adds necessary middlewares and routes to Express application.
     *     Configures JSON parsing, CORS, security headers, API routes etc.
     *     Fixed wildcard route for path-to-regexp error.
     */
    private async configureExpress(): Promise<void> {
        console.log('⚙️ Configuring Express application...');

        try {
            // TR: JSON body parser - gelen isteklerin JSON body'sini parse et
            // EN: JSON body parser - parse JSON body of incoming requests
            this.app.use(express.json({
                limit: '10mb',  // TR: Maximum request body boyutu | EN: Maximum request body size
                strict: true    // TR: Sadece geçerli JSON kabul et | EN: Accept only valid JSON
            }));

            // TR: URL encoded data parser - form verilerini parse et
            // EN: URL encoded data parser - parse form data
            this.app.use(express.urlencoded({
                extended: true,  // TR: Gelişmiş parsing | EN: Advanced parsing
                limit: '10mb'    // TR: Maximum boyut limiti | EN: Maximum size limit
            }));

            // TR: Development ortamında request logging
            // EN: Request logging in development environment
            if (config.isDevelopment) {
                this.app.use((req: Request, _res: Response, next: NextFunction) => {
                    console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
                    next();
                });
            }

            // TR: Ana route - API durumu
            // EN: Main route - API status
            this.app.get('/', (_req: Request, res: Response) => {
                res.json({
                    message: 'GraphQL + Next.js API Server',
                    status: 'running',
                    environment: config.NODE_ENV,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                });
            });

            // TR: API info route
            // EN: API info route
            this.app.get('/api', (_req: Request, res:Response) => {
                res.json({
                    message: 'API Base Endpoint',
                    status: 'available',
                    endpoints: {
                        health: '/health',
                        graphql: '/graphql (coming soon)',
                        status: '/'
                    },
                    timestamp: new Date().toISOString()
                });
            });

            console.log('✅ Express configuration completed');

        } catch (error) {
            console.error('❌ Express configuration failed:', error);
            throw new Error(`Express configuration error: ${error}`);
        }
    }

    /**
     * startServer() - HTTP Sunucu Başlatma Metodu
     *
     * TR: MonitorServer ile HTTP sunucusunu başlatır.
     *     Async olarak çalışır ve başlatma tamamlanana kadar bekler.
     *
     * EN: Starts HTTP server with MonitorServer.
     *     Works asynchronously and waits until startup completes.
     */
    private async startServer(): Promise<void> {
        console.log('🌐 Starting HTTP server...');

        try {
            // TR: MonitorServer ile sunucuyu başlat
            // EN: Start server with MonitorServer
            await this.monitorServer.start();

            console.log('✅ HTTP server started successfully');

        } catch (error) {
            console.error('❌ Server startup failed:', error);
            throw new Error(`Server startup error: ${error}`);
        }
    }

    /**
     * logSuccessfulStartup() - Başarılı Başlatma Log Metodu
     *
     * TR: Uygulama başarıyla başlatıldığında detaylı bilgileri loglar.
     *     Server durumu, bağlantı bilgileri ve kullanılabilir endpoint'leri gösterir.
     *
     * EN: Logs detailed information when application starts successfully.
     *     Shows server status, connection info and available endpoints.
     */
    private logSuccessfulStartup(): void {
        const serverInfo = this.monitorServer.getServerInfo();

        console.log('\n🎉 APPLICATION STARTUP SUCCESSFUL!');
        console.log('=====================================');
        console.log(`📊 Environment: ${serverInfo.environment}`);
        console.log(`🌐 Server Port: ${serverInfo.port}`);
        console.log(`🔧 Process ID: ${serverInfo.pid}`);
        console.log(`⏱️ Startup Time: ${new Date().toISOString()}`);
        console.log('\n🔗 Available Endpoints:');
        console.log(`   • API Status: http://localhost:${serverInfo.port}/`);
        console.log(`   • Health Check: http://localhost:${serverInfo.port}/health`);
        console.log('=====================================\n');
    }

    /**
     * handleBootstrapError() - Bootstrap Hata İşleme Metodu
     *
     * TR: Uygulama başlatma sırasında oluşan hataları işler.
     *     Kaynakları temizler ve graceful shutdown yapar.
     *
     * EN: Handles errors that occur during application bootstrap.
     *     Cleans up resources and performs graceful shutdown.
     *
     * @param error - TR: Oluşan hata | EN: Error that occurred
     */
    private async handleBootstrapError(error: any): Promise<void> {
        console.error('\n💥 BOOTSTRAP ERROR - CLEANING UP...');
        console.error('=====================================');
        console.error('Error details:', error);

        try {
            // TR: Database bağlantısını kapat
            // EN: Close database connection
            console.log('🗄️ Closing database connection...');
            await closeDatabase();

            // TR: Server'ı durdur (eğer başlatılmışsa)
            // EN: Stop server (if started)
            if (this.monitorServer) {
                console.log('🌐 Stopping HTTP server...');
                await this.monitorServer.stop();
            }

        } catch (cleanupError) {
            console.error('❌ Error during cleanup:', cleanupError);
        } finally {
            console.log('💀 Application terminated due to startup failure');
            process.exit(1); // TR: Hata kodu ile çık | EN: Exit with error code
        }
    }

    /**
     * gracefulShutdown() - Graceful Kapatma Metodu
     *
     * TR: Uygulamayı güvenli bir şekilde kapatır. Tüm bağlantıları temizler.
     *     External signal handler'lardan çağrılabilir.
     *
     * EN: Safely shuts down the application. Cleans up all connections.
     *     Can be called from external signal handlers.
     */
    public async gracefulShutdown(): Promise<void> {
        console.log('\n🔄 Starting graceful shutdown...');

        try {
            // TR: Server'ı durdur
            // EN: Stop server
            await this.monitorServer.stop();

            // TR: Database bağlantısını kapat
            // EN: Close database connection
            await closeDatabase();

            console.log('✅ Graceful shutdown completed');
            process.exit(0);

        } catch (error) {
            console.error('❌ Error during graceful shutdown:', error);
            process.exit(1);
        }
    }
}

/**
 * initializeApp() - Ana Başlatma Fonksiyonu
 *
 * TR: Uygulamayı başlatan ana fonksiyon. ApplicationBootstrap singleton'ını kullanır.
 *     Error handling ve graceful shutdown setup'ını yapar.
 *
 * EN: Main function that starts the application. Uses ApplicationBootstrap singleton.
 *     Sets up error handling and graceful shutdown.
 */
const initializeApp = async (): Promise<void> => {
    try {
        // TR: Başlatma zamanını kaydet
        // EN: Record startup time
        const startTime = Date.now();

        console.log('🚀 INITIALIZING APPLICATION...');
        console.log('================================');

        // TR: ApplicationBootstrap instance'ını al ve başlat
        // EN: Get ApplicationBootstrap instance and start
        const app = ApplicationBootstrap.getInstance();
        await app.initializeApplication();

        // TR: Başlatma süresini hesapla
        // EN: Calculate startup time
        const elapsedTime = Date.now() - startTime;
        console.log(`⚡ Application started in ${elapsedTime}ms`);

        // TR: Process signal handler'ları setup et
        // EN: Setup process signal handlers
        process.on('SIGTERM', () => app.gracefulShutdown());
        process.on('SIGINT', () => app.gracefulShutdown());

    } catch (error) {
        console.error('💥 CRITICAL ERROR - Application initialization failed:', error);
        process.exit(1);
    }
};

/**
 * TR: Uygulamayı başlat - bu satır çalıştığında tüm süreç başlar
 * EN: Start application - when this line runs, entire process begins
 */
initializeApp();