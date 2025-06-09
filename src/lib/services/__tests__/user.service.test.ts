import { UserService } from '../user.service';
import prisma from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        ...mockUserData,
        password: 'hashed_password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await userService.createUser(mockUserData);

      expect(result.email).toBe(mockUserData.email);
      expect(result.username).toBe(mockUserData.username);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if email is already in use', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        email: mockUserData.email,
      } as any);

      await expect(userService.createUser(mockUserData)).rejects.toThrow(
        'Email already in use'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await userService.getUserById('1');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById('1');
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    const mockUpdateData = {
      username: 'newusername',
      bio: 'New bio',
    };

    it('should update user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        ...mockUpdateData,
      } as any);

      const result = await userService.updateUser('1', mockUpdateData);
      expect(result.username).toBe(mockUpdateData.username);
      expect(result.bio).toBe(mockUpdateData.bio);
    });

    it('should throw error if new username is taken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: '2',
        username: mockUpdateData.username,
      } as any);

      await expect(userService.updateUser('1', mockUpdateData)).rejects.toThrow(
        'Username already taken'
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockPrisma.user.delete.mockResolvedValue({} as any);

      await userService.deleteUser('1');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
}); 