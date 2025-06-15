/**
 * Type-Safe Apollo Server Integration - Fixed Version with Logger
 *
 * TR: Express type version conflict'ini çözmek için type assertion ve
 *     interface extending kullanarak Apollo Server entegrasyonu.
 *     Professional logging ile enhanced.
 *
 * EN: Apollo Server integration using type assertion and interface extending
 *     to resolve Express type version conflicts.
 *     Enhanced with professional logging.
 */

import * as http from "node:http";
import express, {Express, NextFunction, Request as ExpressRequest, Response as ExpressResponse} from "express";
import {ApolloServer, BaseContext} from "@apollo/server";
import {expressMiddleware} from "@apollo/server/express4";
import {ApolloServerPluginDrainHttpServer} from "@apollo/server/plugin/drainHttpServer";
import {ApolloServerPluginLandingPageLocalDefault} from "@apollo/server/plugin/landingPage/default";
import {ApolloServerPluginLandingPageDisabled} from "@apollo/server/plugin/disabled";
import {config} from "./config";
import {graphqlHTTP} from "express-graphql";
import {buildSchema} from "graphql/utilities";
import cookieSession from "cookie-session";
import logger, {graphqlLogger} from "./logger";

/**
 * Custom Express Types - Type Conflict Fix
 *
 * TR: Express type conflict'ini çözmek için custom type definitions.
 *     Apollo Server ile uyumlu type'lar tanımlanıyor.
 *
 * EN: Custom type definitions to fix Express type conflicts.
 *     Defines types compatible with Apollo Server.
 */
interface CustomRequest extends ExpressRequest {
    // TR: Apollo Server ile uyumlu Request interface
    // EN: Request interface compatible with Apollo Server
    user?: any;
    dataSources?: any;
}

interface CustomResponse extends ExpressResponse {
    // TR: Apollo Server ile uyumlu Response interface
    // EN: Response interface compatible with Apollo Server
}

/**
 * GraphQL Context Interface - Type Safe
 *
 * TR: GraphQL resolver'larında kullanılacak type-safe context.
 *     Custom types kullanarak version conflict'ini önler.
 *
 * EN: Type-safe context to be used in GraphQL resolvers.
 *     Prevents version conflicts using custom types.
 */
interface GraphQLContext extends BaseContext {
    req: CustomRequest;
    res: CustomResponse;
    user?: any;
    dataSources?: any;
}

/**
 * MonitorServer Class - Apollo Server with Type Safety and Professional Logging
 *
 * TR: Type-safe Apollo Server entegrasyonu ile HTTP sunucu yönetimi.
 *     Express type conflict'leri çözülmüş, professional logging eklenmiş, production-ready.
 *
 * EN: HTTP server management with type-safe Apollo Server integration.
 *     Express type conflicts resolved, professional logging added, production-ready.
 */
export default class MonitorServer {
    private readonly app: Express;
    private readonly httpServer: http.Server;
    private readonly apolloServer: ApolloServer<GraphQLContext>;
    private graphqlSchema: any;
    private isShuttingDown: boolean = false;

    constructor(app: Express) {
        this.app = app;
        this.httpServer = new http.Server(this.app);
        this.apolloServer = this.createApolloServer();
        this.setupGracefulShutdown();
    }

    /**
     * createApolloServer() - Type-Safe Apollo Server Creation
     *
     * TR: Type-safe Apollo Server oluşturma. Custom context types kullanır.
     *     Version conflict'leri çözülmüş, clean implementation.
     *
     * EN: Type-safe Apollo Server creation. Uses custom context types.
     *     Version conflicts resolved, clean implementation.
     */
    private createApolloServer(): ApolloServer<GraphQLContext> {
        logger.info('🚀 Creating Apollo Server...');

        // TR: Geçici GraphQL Schema - real schema buraya gelecek
        // EN: Temporary GraphQL Schema - real schema will come here
        const typeDefs = `
            type Query {
                hello: String!
                serverInfo: ServerInfo!
                ping: String!
            }
            
            type ServerInfo {
                status: String!
                environment: String!
                timestamp: String!
                uptime: Float!
                version: String!
            }
            
            type Mutation {
                echo(message: String!): String!
            }
        `;

        // TR: Geçici Resolvers - real resolvers buraya gelecek
        // EN: Temporary Resolvers - real resolvers will come here
        const resolvers = {
            Query: {
                hello: (): string => {
                    return 'Hello from GraphQL Apollo Server! 🚀';
                },

                serverInfo: (): object => ({
                    status: 'running',
                    environment: config.NODE_ENV,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0'
                }),

                ping: (): string => {
                    return `Pong! Server time: ${new Date().toISOString()}`;
                }
            },

            Mutation: {
                echo: (_: any, {message}: { message: string }): string => {
                    return `Echo: ${message}`;
                }
            }
        };

        this.graphqlSchema = buildSchema(typeDefs);

        return new ApolloServer<GraphQLContext>({
            typeDefs,
            resolvers,
            plugins: [
                // TR: HTTP server drain plugin
                // EN: HTTP server drain plugin
                ApolloServerPluginDrainHttpServer({httpServer: this.httpServer}),

                // TR: Development'ta GraphQL Playground
                // EN: GraphQL Playground in development
                ...(config.isDevelopment ? [
                    ApolloServerPluginLandingPageLocalDefault({
                        embed: true,
                        includeCookies: true
                    })
                ] : [
                    ApolloServerPluginLandingPageDisabled()
                ])
            ],

            // TR: Cache ve performance ayarları
            // EN: Cache and performance settings
            cache: config.isProduction ? 'bounded' : undefined,
            introspection: config.isDevelopment,

            // TR: Error formatting - production safe with professional logging
            // EN: Error formatting - production safe with professional logging
            formatError: (error) => {
                if (config.isProduction) {
                    graphqlLogger.error('GraphQL Error:', {
                        message: error.message,
                        code: error.extensions?.code,
                        path: error.path
                    });
                } else {
                    graphqlLogger.debug('GraphQL Error:', {error});
                }

                return config.isProduction ? {
                    message: error.message,
                    code: error.extensions?.code || 'INTERNAL_ERROR',
                    path: error.path
                } : error;
            }
        });
    }

    /**
     * createGraphQLContext() - Type-Safe Context Creation
     *
     * TR: Type-safe GraphQL context oluşturma. Custom types kullanarak
     *     version conflict'lerini önler.
     *
     * EN: Type-safe GraphQL context creation. Prevents version conflicts
     *     using custom types.
     */
    private async createGraphQLContext({
                                           req,
                                           res
                                       }: {
        req: CustomRequest;
        res: CustomResponse;
    }): Promise<GraphQLContext> {

        // TR: Base context objesi
        // EN: Base context object
        const context: GraphQLContext = {
            req: req as CustomRequest,
            res: res as CustomResponse
        };

        // TR: JWT Authentication (optional)
        // EN: JWT Authentication (optional)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                // TR: JWT verification buraya gelecek
                // EN: JWT verification will come here
                logger.debug('🔐 JWT token detected', {tokenPreview: token.substring(0, 10) + '...'});
                // context.user = await verifyJWTToken(token);
            } catch (error) {
                logger.warn('⚠️ Invalid JWT token', {error});
            }
        }

        // TR: Data sources (database, APIs vb.)
        // EN: Data sources (database, APIs etc.)
        context.dataSources = {
            // TR: Database connection buraya gelecek
            // EN: Database connection will come here
            // db: sequelize
        };

        return context;
    }

    /**
     * start() - Server Startup with Type Safety
     *
     * TR: Type-safe server başlatma. Sıralı startup process.
     * EN: Type-safe server startup. Sequential startup process.
     */
    async start(): Promise<void> {
        try {
            logger.info('🚀 Starting server with Apollo GraphQL...');

            // TR: 1. Apollo Server'ı başlat (önce başlatılmalı!)
            // EN: 1. Start Apollo Server (must be started first!)
            await this.startApolloServer();

            // TR: 2. Express middleware'lerini uygula (404 handler YOK!)
            // EN: 2. Apply Express middlewares (NO 404 handler!)
            this.applyStandardMiddleware();

            // TR: 3. GraphQL middleware'ini ekle
            // EN: 3. Add GraphQL middleware
            await this.applyGraphQLMiddleware();

            // TR: 4. 404 handler'ı en SONA ekle
            // EN: 4. Add 404 handler at the END
            this.apply404Handler();

            // TR: 5. HTTP sunucusunu başlat
            // EN: 5. Start HTTP server
            await this.startHttpServer();

        } catch (error) {
            logger.error('❌ Failed to start server:', {error});
            throw error;
        }
    }

    /**
     * startApolloServer() - Apollo Server Startup
     *
     * TR: Apollo Server'ı güvenli şekilde başlatır.
     * EN: Safely starts Apollo Server.
     */
    private async startApolloServer(): Promise<void> {
        logger.info('📡 Starting Apollo Server...');

        try {
            await this.apolloServer.start();
            logger.info('✅ Apollo Server started successfully');

        } catch (error) {
            logger.error('❌ Apollo Server startup failed:', {error});
            throw new Error(`Apollo Server startup error: ${error}`);
        }
    }

    /**
     * applyGraphQLMiddleware() - TYPE-SAFE GraphQL Middleware
     *
     * TR: Type conflict'ini çözen GraphQL middleware implementation.
     *     Type assertion kullanarak Express compatibility sağlanır.
     *
     * EN: GraphQL middleware implementation that resolves type conflicts.
     *     Express compatibility ensured using type assertions.
     */
    private async applyGraphQLMiddleware(): Promise<void> {
        logger.info('🔗 Applying GraphQL middleware...');

        try {
            // TR: CORS middleware önce
            // EN: CORS middleware first
            this.app.use('/graphql', (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                // TR: CORS headers
                // EN: CORS headers
                res.header('Access-Control-Allow-Origin', config.client.corsOrigin || '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                res.header('Access-Control-Allow-Credentials', 'true');

                // TR: Preflight request handling
                // EN: Preflight request handling
                if (req.method === 'OPTIONS') {
                    res.sendStatus(200);
                    return;
                }

                next();
            });

            if (config.isDevelopment) {
                this.app.get('/graphql', graphqlHTTP({
                    schema: this.graphqlSchema,
                    graphiql: true
                }));
                logger.debug('🎮 GraphiQL interface enabled for development');
            }

            // TR: Apollo Server middleware - TYPE-SAFE VERSION
            // EN: Apollo Server middleware - TYPE-SAFE VERSION
            this.app.use(
                '/graphql',
                express.json({limit: '50mb'}), // TR: GraphQL için JSON parsing | EN: JSON parsing for GraphQL
                express.urlencoded({extended: true, limit: '50mb'}),

                // TR: Type-safe expressMiddleware
                // EN: Type-safe expressMiddleware
                expressMiddleware(this.apolloServer, {
                    context: async ({req, res}): Promise<GraphQLContext> => {
                        // TR: Type assertion ile compatibility sağla
                        // EN: Ensure compatibility with type assertion
                        return this.createGraphQLContext({
                            req: req as unknown as CustomRequest,
                            res: res as unknown as CustomResponse
                        });
                    }
                }) as any // TR: Type assertion - conflict'i çözer | EN: Type assertion - resolves conflict
            );

            logger.info('✅ GraphQL middleware applied successfully');
            logger.info(`🔗 GraphQL endpoint: /graphql`);

            if (config.isDevelopment) {
                logger.info(`🎮 GraphQL Playground: http://localhost:${config.PORT}/graphql`);
            }

        } catch (error) {
            logger.error('❌ GraphQL middleware setup failed:', {error});
            throw new Error(`GraphQL middleware error: ${error}`);
        }
    }

    /**
     * applyStandardMiddleware() - Standard Express Middleware with Professional Logging
     *
     * TR: Standart Express middleware'lerini uygular. Professional logging ile enhanced.
     *     404 handler'ı ÇIKARILDI, GraphQL middleware'den SONRA eklenecek.
     *
     * EN: Applies standard Express middlewares. Enhanced with professional logging.
     *     404 handler REMOVED, will be added AFTER GraphQL middleware.
     */
    private applyStandardMiddleware(): void {
        // TR: Proxy settings
        // EN: Proxy settings
        this.app.set('trust proxy', 1);

        // TR: Cookie session ara katmanı
        // EN: Cookie session middleware
        this.app.use(cookieSession({
            name: 'session', // TR: Session cookie adı | EN: Session cookie name
            keys: [config.jwt.secretKeyOne, config.jwt.secretKeyTwo], // TR: Secret key'ler | EN: Secret keys
            maxAge: 24 * 7 * 60 * 60 * 1000, // TR: 1 hafta | EN: 1 week
            secure: !config.isDevelopment, // TR: Production'da secure | EN: Secure in production
            ...(!config.isDevelopment && {
                sameSite: 'none'
            })
        }));

        logger.debug('🍪 Cookie session middleware configured', {
            secure: !config.isDevelopment,
            maxAge: '7 days'
        });

        // TR: Güvenlik başlıkları
        // EN: Security headers
        this.app.use((_req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
            res.header('X-Content-Type-Options', 'nosniff');
            res.header('X-Frame-Options', 'DENY');
            res.header('X-XSS-Protection', '1; mode=block');
            next();
        });

        // TR: İstek loglama (development)
        // EN: Request logging (development)
        if (config.isDevelopment) {
            this.app.use((req: ExpressRequest, _res: ExpressResponse, next: NextFunction) => {
                logger.debug(`📝 ${req.method} ${req.path}`, {
                    method: req.method,
                    path: req.path,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip
                });
                next();
            });
        }

        // TR: Ana rotalar
        // EN: Main routes
        this.app.get('/', (_req: ExpressRequest, res: ExpressResponse) => {
            const responseData = {
                message: 'GraphQL + Next.js API Server',
                status: 'running',
                environment: config.NODE_ENV,
                timestamp: new Date().toISOString(),
                endpoints: {
                    graphql: '/graphql',
                    playground: config.isDevelopment ? '/graphql' : 'disabled',
                    health: '/health'
                },
                version: '1.0.0'
            };

            logger.debug('📊 API status requested', {responseData});
            res.json(responseData);
        });

        // TR: Health check
        // EN: Health check
        this.app.get('/health', (_req: ExpressRequest, res: ExpressResponse) => {
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                ...this.getServerInfo()
            };

            logger.debug('❤️ Health check requested', {healthData});
            res.json(healthData);
        });

        logger.info('✅ Standard middleware applied');
    }

    /**
     * apply404Handler() - 404 Handler with Professional Logging
     *
     * TR: 404 handler'ı ayrı metod olarak tanımlanır. Professional logging ile enhanced.
     *     GraphQL middleware'den SONRA çağrılacak.
     *
     * EN: 404 handler as separate method. Enhanced with professional logging.
     *     Will be called AFTER GraphQL middleware.
     */
    private apply404Handler(): void {
        // TR: 404 handler - TÜM route'lardan ve middleware'lerden SONRA
        // EN: 404 handler - AFTER all routes and middlewares
        this.app.use((req: ExpressRequest, res: ExpressResponse) => {
            const notFoundData = {
                error: 'Route not found',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString(),
                availableEndpoints: ['/', '/health', '/graphql']
            };

            logger.warn('🔍 404 - Route not found', {
                method: req.method,
                path: req.originalUrl,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });

            res.status(404).json(notFoundData);
        });

        logger.info('✅ 404 handler applied');
    }

    /**
     * startHttpServer() - HTTP Server Startup with Professional Logging
     *
     * TR: HTTP sunucusunu başlatır. Professional logging ile enhanced.
     * EN: Starts HTTP server. Enhanced with professional logging.
     */
    private async startHttpServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            const SERVER_PORT = config.PORT;

            this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    logger.error(`❌ Port ${SERVER_PORT} is already in use`, {port: SERVER_PORT, code: error.code});
                } else if (error.code === 'EACCES') {
                    logger.error(`❌ Permission denied to bind to port ${SERVER_PORT}`, {
                        port: SERVER_PORT,
                        code: error.code
                    });
                } else {
                    logger.error('❌ Server error:', {error, port: SERVER_PORT});
                }
                reject(error);
            });

            this.httpServer.listen(SERVER_PORT, () => {
                logger.info(`🚀 Server started successfully`);
                logger.info(`📊 Environment: ${config.NODE_ENV}`);
                logger.info(`🌐 Port: ${SERVER_PORT}`);
                logger.info(`🔧 Process ID: ${process.pid}`);

                if (config.isDevelopment) {
                    logger.info(`\n🔗 Available endpoints:`);
                    logger.info(`   • REST API: http://localhost:${SERVER_PORT}/`);
                    logger.info(`   • Health: http://localhost:${SERVER_PORT}/health`);
                    logger.info(`   • GraphQL: http://localhost:${SERVER_PORT}/graphql`);
                    logger.info(`   • Playground: http://localhost:${SERVER_PORT}/graphql\n`);
                }

                resolve();
            });
        });
    }

    /**
     * stop() - Graceful Server Shutdown with Professional Logging
     *
     * TR: Sunucuyu güvenli şekilde kapatır. Professional logging ile enhanced.
     * EN: Safely shuts down the server. Enhanced with professional logging.
     */
    async stop(): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn('⚠️ Server is already shutting down...');
            return;
        }

        this.isShuttingDown = true;
        logger.info('🔄 Gracefully shutting down server...');

        try {
            await this.apolloServer.stop();
            logger.info('✅ Apollo Server stopped');

            await new Promise<void>((resolve, reject) => {
                this.httpServer.close((error) => {
                    if (error) {
                        logger.error('❌ Error during HTTP server shutdown:', {error});
                        reject(error);
                    } else {
                        logger.info('✅ HTTP server stopped');
                        resolve();
                    }
                });

                setTimeout(() => {
                    logger.warn('⚠️ Force closing server after timeout...');
                    resolve();
                }, 10000);
            });

            logger.info('✅ Server shutdown completed successfully');

        } catch (error) {
            logger.error('❌ Error during shutdown:', {error});
            throw error;
        }
    }

    /**
     * getServerInfo() - Server Information
     *
     * TR: Sunucu bilgilerini döner.
     * EN: Returns server information.
     */
    getServerInfo() {
        return {
            port: config.PORT,
            pid: process.pid,
            environment: config.NODE_ENV,
            uptime: process.uptime(),
            isListening: this.httpServer.listening,
            isShuttingDown: this.isShuttingDown,
            graphql: {
                endpoint: '/graphql',
                playground: config.isDevelopment ? 'enabled' : 'disabled',
                introspection: config.isDevelopment
            }
        };
    }

    /**
     * setupGracefulShutdown() - Graceful Shutdown Setup with Professional Logging
     *
     * TR: Graceful shutdown signal handler'larını kurar. Professional logging ile enhanced.
     * EN: Sets up graceful shutdown signal handlers. Enhanced with professional logging.
     */
    private setupGracefulShutdown(): void {
        const shutdownHandler = async (signal: string) => {
            logger.info(`\n📡 Received ${signal}, starting graceful shutdown...`, {signal});
            try {
                await this.stop();
                process.exit(0);
            } catch (error) {
                logger.error('❌ Error during shutdown:', {error, signal});
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
        process.on('SIGINT', () => shutdownHandler('SIGINT'));

        process.on('uncaughtException', (error) => {
            logger.fatal('❌ Uncaught Exception:', {error});
            shutdownHandler('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection:', {reason, promise});
            shutdownHandler('unhandledRejection');
        });

        logger.debug('🛡️ Graceful shutdown handlers configured');
    }
}