    // my-service.js
    import { prisma } from './prisma-client'; // Assuming you have a singleton Prisma client

    export async function getUserById(id) {
      return prisma.user.findUnique({ where: { id } });
    }

    // my-service.test.js
    import { getUserById } from './my-service';
    import { prisma } from './prisma-client'; // Import the actual Prisma client to mock it

    jest.mock('./prisma-client', () => ({
      prisma: {
        user: {
          findUnique: jest.fn(),
        },
      },
    }));

    describe('getUserById', () => {
      test('should return a user if found', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Mock User' });
        const user = await getUserById(1);
        expect(user).toEqual({ id: 1, name: 'Mock User' });
      });
    });