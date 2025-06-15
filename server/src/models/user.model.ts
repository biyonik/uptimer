import { DataTypes, Model, ModelDefined, Optional, Op } from "sequelize";
import { hash, compare } from "bcryptjs";
import { config } from "@app/server/config";
import { sequelize } from "@app/server/database";
import logger from "@app/server/logger";
import {IAuthPayload, IUserDocument} from "@app/interfaces/user/user.interface";

// ================================
// 🔐 USER MODEL - SYNCHRONIZED
// ================================

const BCRYPT_SALT_ROUNDS = config.security.bcryptSaltRounds;

export const UserModelName = 'Users';

/**
 * User Model Instance Methods Interface
 *
 * TR: User model instance metodları için interface
 * EN: Interface for User model instance methods
 */
interface UserModelInstanceMethods extends Model {
    prototype: {
        comparePassword(password: string, hashedPassword: string): Promise<boolean>;
        hashPassword(password: string): Promise<string>;
        toAuthJSON(): IAuthPayload;
        toJSON(): IUserDocument;
    }
}

/**
 * User Creation Attributes
 *
 * TR: User oluşturma için gerekli attribute'lar (id ve timestamps optional)
 * EN: Required attributes for user creation (id and timestamps optional)
 */
type UserCreationAttributes = Optional<IUserDocument, 'id' | 'createdAt'>;

/**
 * User Model - Interface Synchronized
 *
 * TR: Interface ile sync edilmiş User modeli.
 *     sadece validation, logging ve method'ları iyileştirir.
 *
 * EN: Interface-synchronized User model.
 *     only improves validation, logging and methods.
 */
export const UserModel: ModelDefined<IUserDocument, UserCreationAttributes> & UserModelInstanceMethods = sequelize.define(
    UserModelName,
    {
        // ================================
        // 🆔 CORE FIELDS
        // ================================
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                len: {
                    args: [3, 50],
                    msg: 'Username must be between 3 and 50 characters'
                },
                isAlphanumeric: {
                    msg: 'Username can only contain letters and numbers'
                },
                notEmpty: {
                    msg: 'Username cannot be empty'
                }
            }
        },

        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                isEmail: {
                    msg: 'Please provide a valid email address'
                },
                len: {
                    args: [5, 100],
                    msg: 'Email must be between 5 and 100 characters'
                },
                notEmpty: {
                    msg: 'Email cannot be empty'
                }
            }
        },

        password: {
            type: DataTypes.STRING(255),
            allowNull: true, // Social login için null olabilir
        },

        googleId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Google ID is too long'
                }
            }
        },

        facebookId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Facebook ID is too long'
                }
            }
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    },
    {
        // ================================
        // 🔧 MODEL OPTIONS
        // ================================
        timestamps: true, // createdAt, updatedAt otomatik
        updatedAt: 'updatedAt', // updatedAt field'ini aktif et

        indexes: [
            {
                unique: true,
                fields: ['username'],
                name: 'users_username_unique'
            },
            {
                unique: true,
                fields: ['email'],
                name: 'users_email_unique'
            },
            {
                fields: ['googleId'],
                name: 'users_google_id_index',
                where: {
                    googleId: {
                        [Op.ne]: null
                    }
                }
            },
            {
                fields: ['facebookId'],
                name: 'users_facebook_id_index',
                where: {
                    facebookId: {
                        [Op.ne]: null
                    }
                }
            },
            {
                fields: ['createdAt'],
                name: 'users_created_at_index'
            }
        ],

        // ================================
        // 🔧 MODEL HOOKS - Enhanced with Logging
        // ================================
        hooks: {
            /**
             * Before Create Hook
             *
             * TR: User oluşturulmadan önce password hash'le ve logla
             * EN: Hash password and log before user creation
             */
            beforeCreate: async (user: Model) => {
                try {
                    if (user.dataValues.password !== undefined && user.dataValues.password !== null) {
                        const hashedPassword = await hash(user.dataValues.password, BCRYPT_SALT_ROUNDS);
                        user.dataValues = {
                            ...user.dataValues,
                            password: hashedPassword
                        };
                        user.set(user.dataValues);

                        logger.debug('Password hashed for new user', {
                            username: user.dataValues.username
                        });
                    }
                } catch (error) {
                    logger.error('Error hashing password in beforeCreate hook:', { error });
                    throw new Error('Failed to hash password during user creation');
                }
            },

            /**
             * Before Update Hook
             *
             * TR: User güncellenmeden önce password hash'le (eğer değişmişse)
             * EN: Hash password before user update (if changed)
             */
            beforeUpdate: async (user: Model) => {
                try {
                    if ((user as any).changed('password') && user.dataValues.password) {
                        const hashedPassword = await hash(user.dataValues.password, BCRYPT_SALT_ROUNDS);
                        user.dataValues = {
                            ...user.dataValues,
                            password: hashedPassword
                        };
                        user.set(user.dataValues);

                        logger.debug('Password hashed for user update', {
                            userId: user.dataValues.id
                        });
                    }
                } catch (error) {
                    logger.error('Error hashing password in beforeUpdate hook:', { error });
                    throw new Error('Failed to hash password during user update');
                }
            },

            /**
             * After Create Hook
             *
             * TR: User oluşturulduktan sonra başarılı log
             * EN: Log successful user creation
             */
            afterCreate: async (user: Model) => {
                logger.info('New user created successfully', {
                    userId: user.dataValues.id,
                    username: user.dataValues.username,
                    email: user.dataValues.email,
                    hasGoogleId: !!user.dataValues.googleId,
                    hasFacebookId: !!user.dataValues.facebookId
                });
            },

            /**
             * After Update Hook
             *
             * TR: User güncellendikten sonra log
             * EN: Log after user update
             */
            afterUpdate: async (user: Model) => {
                logger.debug('User updated successfully', {
                    userId: user.dataValues.id,
                    changedFields: Object.keys(user.changed() || {})
                });
            }
        }
    }
) as ModelDefined<IUserDocument, UserCreationAttributes> & UserModelInstanceMethods;

// ================================
// 🔧 USER MODEL INSTANCE METHODS - Interface Compatible
// ================================

/**
 * Compare password with hashed password
 *
 * TR: Şifreyi hash'lenmiş şifre ile karşılaştır
 * EN: Compare password with hashed password
 */
UserModel.prototype.comparePassword = async function (password: string, hashedPassword: string): Promise<boolean> {
    try {
        const isMatch = await compare(password, hashedPassword);
        logger.debug('Password comparison completed', {
            userId: this.dataValues.id,
            isMatch
        });
        return isMatch;
    } catch (error) {
        logger.error('Error comparing passwords:', {
            error,
            userId: this.dataValues.id
        });
        return false;
    }
};

/**
 * Hash password
 *
 * TR: Şifreyi hash'le
 * EN: Hash password
 */
UserModel.prototype.hashPassword = async function (password: string): Promise<string> {
    try {
        const hashedPassword = await hash(password, BCRYPT_SALT_ROUNDS);
        logger.debug('Password hashed successfully', {
            userId: this.dataValues.id
        });
        return hashedPassword;
    } catch (error) {
        logger.error('Error hashing password:', {
            error,
            userId: this.dataValues.id
        });
        throw new Error('Failed to hash password');
    }
};

/**
 * Generate authentication JSON for JWT - Interface Compatible
 *
 * TR: JWT için authentication JSON oluştur (interface'e uygun)
 * EN: Generate authentication JSON for JWT (interface compatible)
 */
UserModel.prototype.toAuthJSON = function (): IAuthPayload {
    return {
        id: this.dataValues.id,
        username: this.dataValues.username,
        email: this.dataValues.email
    };
};

/**
 * Generate public JSON - Interface Compatible
 *
 * TR: Public JSON oluştur (interface'e uygun, şifre olmadan)
 * EN: Generate public JSON (interface compatible, without password)
 */
UserModel.prototype.toJSON = function (): IUserDocument {
    const { password, ...userWithoutPassword } = this.dataValues;
    return userWithoutPassword;
};
