import * as http from "node:http";
import { Express } from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config";

/**
 * MonitorServer Sınıfı
 *
 * TR: HTTP sunucusunu yöneten ana sınıf. Express uygulamasını alır ve onu HTTP sunucusuna dönüştürür.
 *     Sunucu başlatma, durdurma, middleware uygulama ve graceful shutdown işlemlerini yönetir.
 *     Production ortamında güvenlik ve performans için optimize edilmiştir.
 *
 * EN: Main class that manages the HTTP server. Takes an Express application and converts it to an HTTP server.
 *     Handles server starting, stopping, middleware application, and graceful shutdown operations.
 *     Optimized for security and performance in production environments.
 */
export default class MonitorServer {
    /**
     * TR: Express uygulaması referansı - readonly olarak tanımlanmış, değiştirilemez
     * EN: Express application reference - defined as readonly, immutable
     */
    private readonly app: Express;

    /**
     * TR: Node.js HTTP sunucu instance'ı - sunucuyu kontrol etmek için kullanılır
     * EN: Node.js HTTP server instance - used to control the server
     */
    private httpServer: http.Server;

    /**
     * TR: Sunucunun kapatılma durumunu takip eden flag - çift kapatmayı önler
     * EN: Flag tracking server shutdown state - prevents double shutdown
     */
    private isShuttingDown: boolean = false;

    /**
     * Constructor - Kurucu Metot
     *
     * TR: MonitorServer sınıfının yeni bir instance'ını oluşturur.
     *     Express uygulamasını alır ve HTTP sunucusunu initialize eder.
     *     Graceful shutdown mekanizmasını otomatik olarak kurar.
     *
     * EN: Creates a new instance of MonitorServer class.
     *     Takes Express application and initializes HTTP server.
     *     Automatically sets up graceful shutdown mechanism.
     *
     * @param app - TR: Express uygulaması | EN: Express application
     */
    constructor(app: Express) {
        this.app = app;
        this.httpServer = new http.Server(this.app);
        this.setupGracefulShutdown();
    }

    /**
     * start() - Sunucu Başlatma Metodu
     *
     * TR: Sunucuyu başlatır. Middleware'leri uygular ve HTTP sunucusunu ayağa kaldırır.
     *     Hata durumunda exception fırlatır ve işlemi durdurur.
     *     Async olarak çalışır, Promise döner.
     *
     * EN: Starts the server. Applies middlewares and brings up the HTTP server.
     *     Throws exception on error and stops the process.
     *     Works asynchronously, returns Promise.
     *
     * @returns Promise<void> - TR: İşlem tamamlandığında resolve olan Promise | EN: Promise that resolves when operation completes
     */
    async start(): Promise<void> {
        try {
            this.applyStandardMiddleware();
            await this.startHttpServer();
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            throw error;
        }
    }

    /**
     * stop() - Graceful Sunucu Kapatma Metodu
     *
     * TR: Sunucuyu güvenli bir şekilde kapatır. Mevcut bağlantıların tamamlanmasını bekler.
     *     Çift kapatmayı önler, 10 saniye timeout ile force close yapar.
     *     Async olarak çalışır ve kapatma işlemini Promise ile yönetir.
     *
     * EN: Safely shuts down the server. Waits for existing connections to complete.
     *     Prevents double shutdown, force closes with 10-second timeout.
     *     Works asynchronously and manages shutdown process with Promise.
     *
     * @returns Promise<void> - TR: Kapatma tamamlandığında resolve olan Promise | EN: Promise that resolves when shutdown completes
     */
    async stop(): Promise<void> {
        // TR: Eğer zaten kapatılıyorsa, tekrar kapatma işlemi yapma
        // EN: If already shutting down, don't perform shutdown again
        if (this.isShuttingDown) {
            console.log('⚠️ Server is already shutting down...');
            return;
        }

        this.isShuttingDown = true;
        console.log('🔄 Gracefully shutting down server...');

        return new Promise((resolve, reject) => {
            // TR: Yeni bağlantıları kabul etmeyi durdur
            // EN: Stop accepting new connections
            this.httpServer.close((error) => {
                if (error) {
                    console.error('❌ Error during server shutdown:', error);
                    reject(error);
                } else {
                    console.log('✅ Server shutdown complete');
                    resolve();
                }
            });

            // TR: 10 saniye sonra zorla kapat
            // EN: Force close after 10 seconds timeout
            setTimeout(() => {
                console.log('⚠️ Forcing server shutdown...');
                this.httpServer.closeAllConnections?.();
                resolve();
            }, 10000); // 10 seconds timeout
        });
    }

    /**
     * getServerInfo() - Sunucu Bilgileri Metodu
     *
     * TR: Sunucunun mevcut durumu hakkında detaylı bilgi döner.
     *     Port, process ID, environment, uptime, listening durumu gibi bilgileri içerir.
     *     Monitoring ve debugging için kullanılır.
     *
     * EN: Returns detailed information about current server state.
     *     Includes port, process ID, environment, uptime, listening status and more.
     *     Used for monitoring and debugging purposes.
     *
     * @returns object - TR: Sunucu bilgilerini içeren obje | EN: Object containing server information
     */
    getServerInfo() {
        return {
            port: config.PORT,                    // TR: Sunucunun çalıştığı port | EN: Port where server is running
            pid: process.pid,                     // TR: Process ID | EN: Process ID
            environment: config.NODE_ENV,         // TR: Çalışma ortamı | EN: Runtime environment
            uptime: process.uptime(),             // TR: Çalışma süresi (saniye) | EN: Uptime in seconds
            isListening: this.httpServer.listening, // TR: Dinleme durumu | EN: Listening status
            isShuttingDown: this.isShuttingDown, // TR: Kapatılma durumu | EN: Shutdown status
        };
    }

    /**
     * applyStandardMiddleware() - Standart Middleware Uygulama Metodu
     *
     * TR: Express uygulamasına güvenlik ve performans middleware'lerini uygular.
     *     Proxy ayarları, güvenlik header'ları, CORS, cache control gibi ayarları yapar.
     *     Health check endpoint'ini de otomatik olarak ekler.
     *
     * EN: Applies security and performance middlewares to Express application.
     *     Sets proxy settings, security headers, CORS, cache control configurations.
     *     Automatically adds health check endpoint.
     */
    private applyStandardMiddleware(): void {
        // TR: Load balancer'lar için proxy'ye güven
        // EN: Trust proxy for load balancers
        this.app.set('trust proxy', 1);

        // TR: Güvenlik header'ları uygula
        // EN: Apply security headers
        this.app.use((_req: Request, res: Response, next: NextFunction) => {
            // TR: Cache kontrolü - browser'da cache'lemeyi engelle
            // EN: Cache control - prevent browser caching
            res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

            // TR: Güvenlik header'ları
            // EN: Security headers
            res.header('X-Content-Type-Options', 'nosniff');    // TR: MIME type sniffing'i engelle | EN: Prevent MIME type sniffing
            res.header('X-Frame-Options', 'DENY');              // TR: iframe'de gösterimi engelle | EN: Prevent iframe embedding
            res.header('X-XSS-Protection', '1; mode=block');    // TR: XSS koruması aktif et | EN: Enable XSS protection

            // TR: CORS header'ları (gerekirse)
            // EN: CORS headers (if needed)
            if (config.client.corsOrigin) {
                res.header('Access-Control-Allow-Origin', config.client.corsOrigin);
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            }

            next();
        });

        // TR: Health check endpoint'i - sunucu sağlığını kontrol etmek için
        // EN: Health check endpoint - for monitoring server health
        this.app.get('/health', (_req: Request, res: Response) => {
            res.json({
                status: 'healthy',                           // TR: Sağlık durumu | EN: Health status
                timestamp: new Date().toISOString(),        // TR: Timestamp | EN: Timestamp
                ...this.getServerInfo()                     // TR: Sunucu bilgileri | EN: Server information
            });
        });

        console.log('✅ Standard middleware applied');
    }

    /**
     * startHttpServer() - HTTP Sunucu Başlatma Metodu
     *
     * TR: HTTP sunucusunu belirtilen port'ta başlatır.
     *     Hata durumlarını yakalar (port kullanımda, izin yok vb.)
     *     Promise-based çalışır, başlatma tamamlandığında resolve olur.
     *
     * EN: Starts HTTP server on specified port.
     *     Catches error conditions (port in use, permission denied etc.)
     *     Works Promise-based, resolves when startup completes.
     *
     * @returns Promise<void> - TR: Sunucu başlatma tamamlandığında resolve olan Promise | EN: Promise that resolves when server startup completes
     */
    private async startHttpServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            const SERVER_PORT = config.PORT;

            // TR: Sunucu hatalarını yakala
            // EN: Handle server errors
            this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    // TR: Port zaten kullanımda hatası
                    // EN: Port already in use error
                    console.error(`❌ Port ${SERVER_PORT} is already in use`);
                } else if (error.code === 'EACCES') {
                    // TR: Port'a bağlanma izni yok hatası
                    // EN: Permission denied to bind to port error
                    console.error(`❌ Permission denied to bind to port ${SERVER_PORT}`);
                } else {
                    // TR: Diğer sunucu hataları
                    // EN: Other server errors
                    console.error('❌ Server error:', error);
                }
                reject(error);
            });

            // TR: Dinlemeye başla
            // EN: Start listening
            this.httpServer.listen(SERVER_PORT, () => {
                // TR: Başarılı başlatma logları
                // EN: Successful startup logs
                console.log(`🚀 Server started successfully`);
                console.log(`📊 Environment: ${config.NODE_ENV}`);
                console.log(`🌐 Port: ${SERVER_PORT}`);
                console.log(`🔧 Process ID: ${process.pid}`);
                console.log(`🕒 Started at: ${new Date().toISOString()}`);

                // TR: Development ortamında ek bilgiler
                // EN: Additional info in development environment
                if (config.isDevelopment) {
                    console.log(`🔗 Health check: http://localhost:${SERVER_PORT}/health`);
                }

                resolve();
            });
        });
    }

    /**
     * setupGracefulShutdown() - Graceful Shutdown Kurulum Metodu
     *
     * TR: Sistem signal'larını (SIGTERM, SIGINT) yakalar ve graceful shutdown yapar.
     *     Beklenmeyen hataları (uncaught exception, unhandled rejection) da yakalar.
     *     Process'in güvenli bir şekilde sonlanmasını sağlar.
     *
     * EN: Catches system signals (SIGTERM, SIGINT) and performs graceful shutdown.
     *     Also catches unexpected errors (uncaught exception, unhandled rejection).
     *     Ensures safe process termination.
     */
    private setupGracefulShutdown(): void {
        /**
         * shutdownHandler - Kapatma İşleyicisi
         *
         * TR: Signal aldığında çalışan kapatma fonksiyonu.
         *     Hangi signal alındığını loglar ve graceful shutdown başlatır.
         *
         * EN: Shutdown function that runs when signal is received.
         *     Logs which signal was received and initiates graceful shutdown.
         */
        const shutdownHandler = async (signal: string) => {
            console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);
            try {
                await this.stop();
                process.exit(0); // TR: Başarılı çıkış | EN: Successful exit
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1); // TR: Hatalı çıkış | EN: Error exit
            }
        };

        // TR: Kapatma signal'larını yakala
        // EN: Handle shutdown signals
        process.on('SIGTERM', () => shutdownHandler('SIGTERM')); // TR: Terminate signal | EN: Terminate signal
        process.on('SIGINT', () => shutdownHandler('SIGINT'));   // TR: Interrupt signal (Ctrl+C) | EN: Interrupt signal (Ctrl+C)

        // TR: Yakalanmamış exception'ları yakala
        // EN: Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            shutdownHandler('uncaughtException');
        });

        // TR: İşlenmeyen Promise rejection'larını yakala
        // EN: Handle unhandled Promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            shutdownHandler('unhandledRejection');
        });
    }
}