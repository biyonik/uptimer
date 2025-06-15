// ================================
// 👤 USER SERVICE - ENHANCED BUSINESS LOGIC LAYER
// ================================

/**
 * Example Usage:
 * Create user
 * const result = await UserService.createUser({
 *     username: 'johndoe',
 *     email: 'john@example.com',
 *     password: 'password123'
 * });
 *
 * if (result.success) {
 *     console.log('User created:', result.data);
 * } else {
 *     console.error('Error:', result.error);
 * }
 */

import {UserModel} from "@app/models";
import {IAuthPayload, IUserCreate, IUserDocument, IUserLogin, IUserUpdate} from "@app/interfaces/user/user.interface";
import {IServiceResult} from "@app/interfaces/common/service-result.interface";
import {IDbOptions} from "@app/interfaces/common/database-options.interface";
import {IUserQuery} from "@app/interfaces/user/user.query.interface";
import {IPagination} from "@app/interfaces/common/pagination.interface";
import logger from "@app/server/logger";
import {Model, Op, WhereOptions} from "sequelize";

/**
 * UserService Class - Professional Business Logic Layer
 *
 * TR: Professional user business logic yönetimi. Type-safe operations,
 *     comprehensive error handling, logging ve validation.
 *
 * EN: Professional user business logic management. Type-safe operations,
 *     comprehensive error handling, logging and validation.
 */
export class UserService {
    /**
     * Create new user with validation
     *
     * TR: Validation ile yeni kullanıcı oluştur
     * EN: Create new user with validation
     */
    static async createUser(userData: IUserCreate, options?: IDbOptions): Promise<IServiceResult<IUserDocument>> {
        try {
            logger.info('Creating new user', {
                username: userData.username,
                email: userData.email,
                hasPassword: !!userData.password,
                authMethod: userData.googleId ? 'google' : userData.facebookId ? 'facebook' : 'email'
            });

            // TR: Email benzersizlik kontrolü
            // EN: Email uniqueness check
            const existingEmail = await UserModel.findOne({
                where: {email: userData.email},
                attributes: ['id'],
                ...options
            });

            if (existingEmail) {
                return {
                    success: false,
                    error: 'Email already exists',
                    statusCode: 409
                };
            }

            // TR: Username benzersizlik kontrolü
            // EN: Username uniqueness check
            const existingUsername = await UserModel.findOne({
                where: {username: userData.username},
                attributes: ['id'],
                ...options
            });

            if (existingUsername) {
                return {
                    success: false,
                    error: 'Username already exists',
                    statusCode: 409
                };
            }

            // TR: User oluştur
            // EN: Create user
            const user = await UserModel.create(userData as any, options);
            const userResponse = user.toJSON();

            logger.info('User created successfully', {
                userId: userResponse.id,
                username: userResponse.username,
                email: userResponse.email
            });

            return {
                success: true,
                data: userResponse,
                statusCode: 201
            };

        } catch (error) {
            logger.error('Error creating user:', {error, userData: {...userData, password: '***'}});
            return {
                success: false,
                error: 'Failed to create user',
                statusCode: 500
            };
        }
    }

    /**
     * Get user by ID
     *
     * TR: ID ile kullanıcı getir
     * EN: Get user by ID
     */
    static async getUserById(userId: string, options?: IDbOptions): Promise<IServiceResult<IUserDocument>> {
        try {
            const user = await UserModel.findByPk(userId, {
                attributes: {exclude: ['password']},
                ...options
            });

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: user.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching user by ID:', {error, userId});
            return {
                success: false,
                error: 'Failed to fetch user',
                statusCode: 500
            };
        }
    }

    /**
     * Get user by email (for authentication)
     *
     * TR: Email ile kullanıcı getir (authentication için password dahil)
     * EN: Get user by email (with password for authentication)
     */
    static async getUserByEmailForAuth(email: string, options?: IDbOptions): Promise<IServiceResult<any>> {
        try {
            const user = await UserModel.findOne({
                where: {email},
                ...options
            });

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: user, // TR: Model instance döner, password dahil | EN: Returns model instance with password
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching user by email for auth:', {error, email});
            return {
                success: false,
                error: 'Failed to fetch user',
                statusCode: 500
            };
        }
    }

    /**
     * Get user by username
     *
     * TR: Username ile kullanıcı getir
     * EN: Get user by username
     */
    static async getUserByUsername(username: string, options?: IDbOptions): Promise<IServiceResult<IUserDocument>> {
        try {
            const user = await UserModel.findOne({
                where: {username},
                attributes: {exclude: ['password']},
                ...options
            });

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: user.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching user by username:', {error, username});
            return {
                success: false,
                error: 'Failed to fetch user',
                statusCode: 500
            };
        }
    }

    /**
     * Get user by social ID (Google or Facebook)
     *
     * TR: Sosyal ID ile kullanıcı getir (Google veya Facebook)
     * EN: Get user by social ID (Google or Facebook)
     */
    static async getUserBySocialId(socialId: string, provider: 'google' | 'facebook', options?: IDbOptions): Promise<IServiceResult<IUserDocument>> {
        try {
            const whereCondition = provider === 'google' ? {googleId: socialId} : {facebookId: socialId};

            const user = await UserModel.findOne({
                where: whereCondition,
                attributes: {exclude: ['password']},
                ...options
            });

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: user.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching user by social ID:', {error, socialId, provider});
            return {
                success: false,
                error: 'Failed to fetch user',
                statusCode: 500
            };
        }
    }

    /**
     * Update user
     *
     * TR: Kullanıcı güncelle
     * EN: Update user
     */
    static async updateUser(userId: string, updateData: IUserUpdate, options?: IDbOptions): Promise<IServiceResult<IUserDocument>> {
        try {
            logger.info('Updating user', {userId, updateFields: Object.keys(updateData)});

            // TR: Email uniqueness check (eğer email değişiyorsa)
            // EN: Email uniqueness check (if email is changing)
            if (updateData.email) {
                const existingEmail = await UserModel.findOne({
                    where: {
                        email: updateData.email,
                        id: {[Op.ne]: userId} // TR: Mevcut user hariç | EN: Exclude current user
                    },
                    attributes: ['id'],
                    ...options
                });

                if (existingEmail) {
                    return {
                        success: false,
                        error: 'Email already exists',
                        statusCode: 409
                    };
                }
            }

            // TR: Username uniqueness check (eğer username değişiyorsa)
            // EN: Username uniqueness check (if username is changing)
            if (updateData.username) {
                const existingUsername = await UserModel.findOne({
                    where: {
                        username: updateData.username,
                        id: {[Op.ne]: userId} // TR: Mevcut user hariç | EN: Exclude current user
                    },
                    attributes: ['id'],
                    ...options
                });

                if (existingUsername) {
                    return {
                        success: false,
                        error: 'Username already exists',
                        statusCode: 409
                    };
                }
            }

            const [affectedRows] = await UserModel.update(updateData, {
                where: {id: userId},
                ...options
            });

            if (affectedRows === 0) {
                return {
                    success: false,
                    error: 'User not found or no changes made',
                    statusCode: 404
                };
            }

            // TR: Güncellenmiş user'ı getir
            // EN: Fetch updated user
            const updatedUser = await UserModel.findByPk(userId, {
                attributes: {exclude: ['password']},
                ...options
            });

            logger.info('User updated successfully', {userId});

            return {
                success: true,
                data: updatedUser!.dataValues,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error updating user:', {error, userId, updateData});
            return {
                success: false,
                error: 'Failed to update user',
                statusCode: 500
            };
        }
    }

    /**
     * Delete user
     *
     * TR: Kullanıcı sil
     * EN: Delete user
     */
    static async deleteUser(userId: string, options?: IDbOptions): Promise<IServiceResult<boolean>> {
        try {
            logger.info('Deleting user', {userId});

            const deletedRows = await UserModel.destroy({
                where: {id: userId},
                ...options
            });

            if (deletedRows === 0) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            logger.info('User deleted successfully', {userId});

            return {
                success: true,
                data: true,
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error deleting user:', {error, userId});
            return {
                success: false,
                error: 'Failed to delete user',
                statusCode: 500
            };
        }
    }

    /**
     * Get users with pagination and filtering
     *
     * TR: Pagination ve filtreleme ile kullanıcıları getir
     * EN: Get users with pagination and filtering
     */
    static async getUsers(query: IUserQuery, options?: IDbOptions): Promise<IServiceResult<{
        users: IUserDocument[],
        pagination: IPagination
    }>> {
        try {
            const {
                search = '',
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            // TR: Arama koşulları
            // EN: Search conditions
            let whereConditions: WhereOptions = {};

            if (search) {
                whereConditions = {
                    [Op.or]: [
                        {username: {[Op.iLike]: `%${search}%`}},
                        {email: {[Op.iLike]: `%${search}%`}}
                    ]
                };
            }

            // TR: Sayfalama
            // EN: Pagination
            const offset = (page - 1) * limit;

            // TR: Toplam kullanıcı sayısını al
            // EN: Count total users
            const total = await UserModel.count({
                where: whereConditions,
                ...options
            });

            // TR: Kullanıcıları getir
            // EN: Fetch users
            const users = await UserModel.findAll({
                where: whereConditions,
                attributes: {exclude: ['password']},
                limit,
                offset,
                order: [[sortBy, sortOrder.toUpperCase()]],
                ...options
            });

            // TR: Sayfalama bilgisi
            // EN: Pagination info
            const totalPages = Math.ceil(total / limit);
            const pagination: IPagination = {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };

            const userData: IUserDocument[] = users.map((user: Model<IUserDocument, Omit<IUserDocument, "id" | "createdAt"> & Partial<Pick<IUserDocument, "id" | "createdAt">>>) => user.dataValues);

            return {
                success: true,
                data: {
                    users: userData,
                    pagination
                },
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error fetching users:', {error, query});
            return {
                success: false,
                error: 'Failed to fetch users',
                statusCode: 500
            };
        }
    }

    /**
     * Verify user credentials for login
     *
     * TR: Login için kullanıcı credential'larını doğrula
     * EN: Verify user credentials for login
     */
    static async verifyCredentials(credentials: IUserLogin): Promise<IServiceResult<{
        user: IUserDocument,
        authPayload: IAuthPayload
    }>> {
        try {
            const {identifier, password} = credentials;

            logger.info('Verifying user credentials', {identifier});

            // TR: Email veya username ile kullanıcı bul
            // EN: Find user by email or username
            const userResult: IServiceResult<any> = await this.getUserByEmailForAuth(identifier);

            if (!userResult.success) {
                // TR: Username ile dene
                // EN: Try with username
                const userByUsername: Model<IUserDocument, Omit<IUserDocument, "id" | "createdAt"> & Partial<Pick<IUserDocument, "id" | "createdAt">>> | null = await UserModel.findOne({
                    where: {username: identifier}
                });

                if (!userByUsername) {
                    return {
                        success: false,
                        error: 'Invalid credentials',
                        statusCode: 401
                    };
                }

                userResult.data = userByUsername;
            }

            const user: any = userResult.data;

            // TR: Password check
            // EN: Password check
            if (!user.dataValues.password) {
                return {
                    success: false,
                    error: 'User has no password (social login only)',
                    statusCode: 401
                };
            }

            const isPasswordValid: any = await user.comparePassword(password, user.dataValues.password);

            if (!isPasswordValid) {
                logger.warn('Invalid password attempt', {identifier});
                return {
                    success: false,
                    error: 'Invalid credentials',
                    statusCode: 401
                };
            }

            const userResponse = user.toJSON();
            const authPayload = user.toAuthJSON();

            logger.info('User credentials verified successfully', {userId: userResponse.id});

            return {
                success: true,
                data: {
                    user: userResponse,
                    authPayload
                },
                statusCode: 200
            };

        } catch (error) {
            logger.error('Error verifying credentials:', {error, identifier: credentials.identifier});
            return {
                success: false,
                error: 'Failed to verify credentials',
                statusCode: 500
            };
        }
    }
}