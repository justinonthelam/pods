import type { User, UserRole } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

export interface CreateUserData {
  email: string;
  password?: string;
  name?: string;
  username: string;
  profileImage?: string;
  bio?: string;
  preferredLanguages?: string[];
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  profileImage?: string;
  bio?: string;
  isPrivate?: boolean;
  preferredLanguages?: string[];
  notificationPrefs?: Record<string, any>;
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    const { email, password, ...rest } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: rest.username }],
      },
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken'
      );
    }

    // Hash password if provided
    const hashedPassword = password ? await hash(password, 12) : null;

    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    // Check username uniqueness if being updated
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new Error('Username already taken');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  /**
   * Verify user password
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) {
      return false;
    }

    return compare(password, user.password);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Mark email as verified
   */
  async markEmailAsVerified(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
  }
} 