// tests/unit/application/services/AuthService.test.js - Test de AuthService
const AuthService = require('../../../../src/application/services/AuthService');
const User = require('../../../../src/domain/entities/User');
const { UserAlreadyExistsError, InvalidCredentialsError } = require('../../../../src/shared/errors/BusinessErrors');

describe('AuthService', () => {
    let authService;
    let mockUserRepository;
    let mockLogRepository;
    let mockConfigService;
    let mockEventBus;

    beforeEach(() => {
        mockUserRepository = {
            findByEmailOrDni: jest.fn(),
            findByEmail: jest.fn(),
            findByDni: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        };

        mockLogRepository = {
            create: jest.fn()
        };

        mockConfigService = {
            getInitialConfig: jest.fn().mockResolvedValue({
                initialUsdBalance: 1000,
                initialPenBalance: 3500,
                baseCommissionRate: 0.005
            })
        };

        mockEventBus = {
            publish: jest.fn()
        };

        authService = new AuthService(
            mockUserRepository,
            mockLogRepository,
            mockConfigService,
            mockEventBus
        );
    });

    describe('register', () => {
        const validRegistrationData = {
            name: 'John Doe',
            email: 'john@example.com',
            dni: '12345678',
            phone: '987654321'
        };

        it('should register user successfully', async () => {
            mockUserRepository.findByEmailOrDni.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue(new User({
                id: 'user123',
                ...validRegistrationData,
                usdBalance: 1000,
                penBalance: 3500,
                role: 'user'
            }));

            const result = await authService.register(validRegistrationData);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.name).toBe('John Doe');
            expect(mockEventBus.publish).toHaveBeenCalledWith('UserRegistered', expect.any(User));
        });

        it('should throw error if user already exists', async () => {
            mockUserRepository.findByEmailOrDni.mockResolvedValue(new User({
                id: 'existing-user',
                ...validRegistrationData
            }));

            await expect(authService.register(validRegistrationData))
                .rejects.toThrow(UserAlreadyExistsError);
        });

        it('should throw error with invalid data', async () => {
            const invalidData = { ...validRegistrationData, email: 'invalid-email' };

            await expect(authService.register(invalidData))
                .rejects.toThrow();
        });
    });

    describe('login', () => {
        const mockUser = new User({
            id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            dni: '12345678',
            phone: '987654321',
            role: 'user'
        });

        it('should login with email successfully', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockUserRepository.update.mockResolvedValue(mockUser);

            const result = await authService.login({ email: 'john@example.com' });

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe('john@example.com');
            expect(mockEventBus.publish).toHaveBeenCalledWith('UserLoggedIn', mockUser);
        });

        it('should login with DNI successfully', async () => {
            mockUserRepository.findByDni.mockResolvedValue(mockUser);
            mockUserRepository.update.mockResolvedValue(mockUser);

            const result = await authService.login({ dni: '12345678' });

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
        });

        it('should throw error with invalid credentials', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.login({ email: 'nonexistent@example.com' }))
                .rejects.toThrow(InvalidCredentialsError);
        });
    });
});
