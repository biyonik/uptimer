import { DataTypes, Model, ModelDefined, Optional } from "sequelize";
import { hash, compare } from "bcryptjs";
import { config } from "@app/server/config";
import { sequelize } from "@app/server/database";
import logger from "@app/server/logger";
import {IAuthPayload, IUserDocument} from "@app/interfaces/user/user.interface";

// ================================
// 🔐 USER MODEL - COLUMN NAMES FIXED
// ================================

const BCRYPT_SALT_ROUNDS = config.security.bcryptSaltRounds;

export const UserModelName = 'Users';

/**
 * User Model Instance Methods Interface
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
 */
type UserCreationAttributes = Optional<IUserDocument, 'id' | 'createdAt'>;

/**
 * User Model - Column Names Fixed for Sequelize underscored
 *
 * TR: Sequelize underscored: true ile uyumlu column mapping'i
 * EN: Column mapping compatible with Sequelize underscored: true
 */
const UserModel: ModelDefined<IUserDocument, UserCreationAttributes> & UserModelInstanceMethods = sequelize.define(
    UserModelName,
    {
        // ================================
        // 🆔 PRIMARY KEY - UUID
        // ================================
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },

        // ================================
        // 🆔 CORE FIELDS - Explicit column mapping
        // ================================
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
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
            unique: true,
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
            validate: {
                len: {
                    args: [0, 255],
                    msg: 'Password is too long'
                }
            }
        },

        googleId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'google_id', // TR: Database'de google_id olarak | EN: As google_id in database
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
            field: 'facebook_id', // TR: Database'de facebook_id olarak | EN: As facebook_id in database
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
            allowNull: false,
            field: 'created_at' // TR: Database'de created_at olarak | EN: As created_at in database
        },

        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
            field: 'updated_at' // TR: Database'de updated_at olarak | EN: As updated_at in database
        }
    },
    {
        // ================================
        // 🔧 MODEL OPTIONS - Fixed for underscored
        // ================================
        tableName: 'Users', // Explicit table name
        timestamps: true,
        underscored: true, // TR: Snake case column names | EN: Snake case column names
        createdAt: 'created_at',
        updatedAt: 'updated_at',

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
                fields: ['google_id'], // Snake case
                name: 'users_google_id_index'
            },
            {
                fields: ['facebook_id'], // Snake case
                name: 'users_facebook_id_index'
            }
        ],

        // ================================
        // 🔧 MODEL HOOKS - Simplified
        // ================================
        hooks: {
            /**
             * Before Create Hook
             */
            beforeCreate: async (user: Model) => {
                try {
                    // TR: UUID generate et (eğer yoksa)
                    // EN: Generate UUID (if not exists)
                    if (!user.dataValues.id) {
                        const { v4: uuidv4 } = await import('uuid');
                        user.dataValues.id = uuidv4();
                        user.set('id', user.dataValues.id);
                    }

                    // TR: Password hash'le (eğer varsa)
                    // EN: Hash password (if exists)
                    if (user.dataValues.password !== undefined && user.dataValues.password !== null && user.dataValues.password.length > 0) {
                        const hashedPassword = await hash(user.dataValues.password, BCRYPT_SALT_ROUNDS);
                        user.dataValues.password = hashedPassword;
                        user.set('password', hashedPassword);

                        logger.debug('Password hashed for new user', {
                            username: user.dataValues.username,
                            userId: user.dataValues.id
                        });
                    }

                    // TR: String field'leri trim et
                    // EN: Trim string fields
                    if (user.dataValues.username) {
                        user.dataValues.username = user.dataValues.username.trim();
                        user.set('username', user.dataValues.username);
                    }

                    if (user.dataValues.email) {
                        user.dataValues.email = user.dataValues.email.trim().toLowerCase();
                        user.set('email', user.dataValues.email);
                    }

                } catch (error) {
                    logger.error('Error in beforeCreate hook:', { error });
                    throw new Error('Failed to prepare user for creation');
                }
            },

            /**
             * After Create Hook
             */
            afterCreate: async (user: Model) => {
                try {
                    logger.info('New user created successfully', {
                        userId: user.dataValues.id,
                        username: user.dataValues.username,
                        email: user.dataValues.email,
                        hasGoogleId: !!user.dataValues.googleId,
                        hasFacebookId: !!user.dataValues.facebookId,
                        hasPassword: !!user.dataValues.password
                    });
                } catch (hookError) {
                    logger.warn('Error in afterCreate hook:', { hookError });
                }
            }
        }
    }
) as ModelDefined<IUserDocument, UserCreationAttributes> & UserModelInstanceMethods;

// ================================
// 🔧 USER MODEL INSTANCE METHODS
// ================================

/**
 * Compare password with hashed password
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
 * Generate authentication JSON for JWT
 */
UserModel.prototype.toAuthJSON = function (): IAuthPayload {
    return {
        id: this.dataValues.id,
        username: this.dataValues.username,
        email: this.dataValues.email
    };
};

/**
 * Generate public JSON
 */
UserModel.prototype.toJSON = function (): IUserDocument {
    const { password, ...userWithoutPassword } = this.dataValues;
    return userWithoutPassword;
};

export default UserModel;