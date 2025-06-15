// ================================
// 🔔 NOTIFICATION INTERFACES
// ================================

/**
 * Notification Document Interface
 *
 * TR: Veritabanı notification modeli için interface. Eğitmenin yapısını korur.
 * EN: Interface for database notification model. Preserves instructor's structure.
 */
export interface INotificationDocument {
    /** TR: Benzersiz bildirim ID'si | EN: Unique notification ID */
    id?: string;

    /** TR: Bildirim sahibi kullanıcı ID'si | EN: Notification owner user ID */
    userId: string;

    /** TR: Bildirim grubu adı | EN: Notification group name */
    groupName: string;

    /** TR: Email adresleri (string olarak, virgülle ayrılmış) | EN: Email addresses (as string, comma separated) */
    emails: string;

    /** TR: Bildirim oluşturulma zamanı | EN: Notification creation time */
    createdAt?: Date;
}

/**
 * Notification Creation Interface
 *
 * TR: Yeni bildirim oluşturma için gerekli bilgiler
 * EN: Required information for creating new notification
 */
export interface INotificationCreate {
    userId: string;
    groupName: string;
    emails: string;
}

/**
 * Notification Update Interface
 *
 * TR: Bildirim güncelleme için izin verilen alanlar
 * EN: Allowed fields for notification updates
 */
export interface INotificationUpdate {
    groupName?: string;
    emails?: string;
}

// ================================
// 📧 EMAIL INTERFACES
// ================================

/**
 * Email Locals Interface
 *
 * TR: Email template'lerinde kullanılan değişkenler
 * EN: Variables used in email templates
 */
export interface IEmailLocals {
    /** TR: Gönderen email adresi | EN: Sender email address */
    sender?: string;

    /** TR: Uygulama linki | EN: Application link */
    appLink: string;

    /** TR: Uygulama ikonu URL'si | EN: Application icon URL */
    appIcon: string;

    /** TR: Uygulama adı | EN: Application name */
    appName: string;

    /** TR: Email konusu | EN: Email subject */
    subject?: string;

    /** TR: Kullanıcı adı | EN: Username */
    username?: string;
}