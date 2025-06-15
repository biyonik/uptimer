// ================================
// 🌍 GLOBAL EXPRESS EXTENSIONS
// ================================

import {INotificationDocument} from "@app/interfaces/notification/notification.interface";

declare global {
    namespace Express {
        interface Request {
            /**
             * TR: JWT'den gelen authenticated user bilgisi
             * EN: Authenticated user info from JWT
             */
            currentUser?: IAuthPayload;
        }
    }
}

// ================================
// 🔐 AUTHENTICATION INTERFACES
// ================================

/**
 * JWT Authentication Payload
 *
 * TR: JWT token'ında bulunan kullanıcı bilgileri
 * EN: User information contained in JWT token
 */
export interface IAuthPayload {
    /** TR: Kullanıcı ID'si | EN: User ID */
    id: string;

    /** TR: Kullanıcı adı | EN: Username */
    username: string;

    /** TR: Email adresi | EN: Email address */
    email: string;

    /** TR: Token oluşturulma zamanı | EN: Token issued at time */
    iat?: number;
}

// ================================
// 👤 USER INTERFACES
// ================================

/**
 * User Document Interface - Database Model
 *
 * TR: Veritabanı user modeli için interface. Eğitmenin field'larını koruyarak
 *     gerekli metotları tanımlar.
 *
 * EN: Interface for database user model. Preserves instructor's fields
 *     while defining necessary methods.
 */
export interface IUserDocument {
    /** TR: Benzersiz kullanıcı ID'si | EN: Unique user ID */
    id?: string;

    /** TR: Kullanıcı adı (benzersiz) | EN: Username (unique) */
    username?: string;

    /** TR: Email adresi (benzersiz) | EN: Email address (unique) */
    email?: string;

    /** TR: Hash'lenmiş şifre | EN: Hashed password */
    password?: string;

    /** TR: Google OAuth ID | EN: Google OAuth ID */
    googleId?: string;

    /** TR: Facebook OAuth ID | EN: Facebook OAuth ID */
    facebookId?: string;

    /** TR: Kullanıcı oluşturulma zamanı | EN: User creation time */
    createdAt?: Date;

    // ================================
    // 🔧 INSTANCE METHODS
    // ================================

    /**
     * TR: Şifreyi hash'lenmiş şifre ile karşılaştır
     * EN: Compare password with hashed password
     */
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;

    /**
     * TR: Şifreyi hash'le
     * EN: Hash password
     */
    hashPassword(password: string): Promise<string>;

    /**
     * TR: JWT için authentication payload'u döndür
     * EN: Return authentication payload for JWT
     */
    toAuthJSON(): IAuthPayload;

    /**
     * TR: Public JSON representation döndür (şifre olmadan)
     * EN: Return public JSON representation (without password)
     */
    toJSON(): IUserDocument;
}

/**
 * User Creation Interface
 *
 * TR: Yeni kullanıcı oluşturma için gerekli bilgiler
 * EN: Required information for creating new user
 */
export interface IUserCreate {
    username: string;
    email: string;
    password?: string;
    googleId?: string;
    facebookId?: string;
}

/**
 * User Update Interface
 *
 * TR: Kullanıcı güncelleme için izin verilen alanlar
 * EN: Allowed fields for user updates
 */
export interface IUserUpdate {
    username?: string;
    email?: string;
    password?: string;
}

/**
 * User Login Interface
 *
 * TR: Kullanıcı giriş bilgileri
 * EN: User login credentials
 */
export interface IUserLogin {
    /** TR: Email veya username | EN: Email or username */
    identifier: string;
    password: string;
}

/**
 * User Response Interface
 *
 * TR: API response'unda döndürülen kullanıcı bilgisi ve bildirimleri
 * EN: User information and notifications returned in API responses
 */
export interface IUserResponse {
    user: IUserDocument;
    notifications: INotificationDocument[];
}