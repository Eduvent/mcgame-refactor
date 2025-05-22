const User = require('../../../../src/domain/entities/User');
const { ValidationError } = require('../../../../src/shared/errors/BusinessErrors');
const { ROLES } = require('../../../../src/shared/constants/roles');

describe('User Entity', () => {
    const validUserData = {
        id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        dni: '12345678',
        phone: '987654321',
        usdBalance: 1000,
        penBalance: 3500,
        initialUsd: 1000,
        initialPen: 3500,
        role: ROLES.USER,
        commissionRate: 0.005
    };

    describe('Constructor', () => {
        it('should create user with valid data', () => {
            const user = new User(validUserData);

            expect(user.name).toBe('John Doe');
            expect(user.email).toBe('john@example.com');
            expect(user.usdBalance).toBe(1000);
            expect(user.isRegularUser()).toBe(true);
        });

        it('should throw error with invalid data', () => {
            expect(() => {
                new User({ ...validUserData, name: null });
            }).toThrow(ValidationError);
        });
    });

    describe('Role Methods', () => {
        it('should identify regular user correctly', () => {
            const user = new User(validUserData);

            expect(user.isRegularUser()).toBe(true);
            expect(user.isTrader()).toBe(false);
            expect(user.isAdmin()).toBe(false);
        });

        it('should identify trader correctly', () => {
            const trader = new User({ ...validUserData, role: ROLES.TRADER });

            expect(trader.isTrader()).toBe(true);
            expect(trader.isRegularUser()).toBe(false);
        });
    });

    describe('Balance Methods', () => {
        it('should check USD balance correctly', () => {
            const user = new User(validUserData);

            expect(user.hasSufficientUsdBalance(500)).toBe(true);
            expect(user.hasSufficientUsdBalance(1500)).toBe(false);
        });

        it('should allow unlimited funds for traders', () => {
            const trader = new User({ ...validUserData, role: ROLES.TRADER });

            expect(trader.hasSufficientUsdBalance(999999)).toBe(true);
            expect(trader.hasSufficientPenBalance(999999)).toBe(true);
        });

        it('should calculate commission correctly', () => {
            const user = new User(validUserData);

            expect(user.calculateCommission(1000)).toBe(5); // 0.5% of 1000
        });
    });

    describe('Order Affordability', () => {
        it('should check buy order affordability', () => {
            const user = new User(validUserData);

            // Buy 100 USD at rate 3.5 = 350 PEN + commission
            expect(user.canAffordOrder('buy', 100, 3.5)).toBe(true);

            // Buy 1000 USD at rate 3.5 = 3500 PEN + commission (175) = 3675 total
            expect(user.canAffordOrder('buy', 1000, 3.5)).toBe(false);
        });

        it('should check sell order affordability', () => {
            const user = new User(validUserData);

            expect(user.canAffordOrder('sell', 500, 3.5)).toBe(true);
            expect(user.canAffordOrder('sell', 1500, 3.5)).toBe(false);
        });
    });

    describe('Fund Reservation', () => {
        it('should reserve funds for buy order', () => {
            const user = new User(validUserData);
            const initialPenBalance = user.penBalance;

            user.reserveFunds('buy', 100, 3.5); // 350 + 1.75 commission = 351.75

            expect(user.penBalance).toBe(initialPenBalance - 351.75);
        });

        it('should reserve funds for sell order', () => {
            const user = new User(validUserData);
            const initialUsdBalance = user.usdBalance;

            user.reserveFunds('sell', 100, 3.5);

            expect(user.usdBalance).toBe(initialUsdBalance - 100);
        });

        it('should throw error if insufficient funds', () => {
            const user = new User(validUserData);

            expect(() => {
                user.reserveFunds('buy', 1000, 3.6); // Would need 3600 + commission
            }).toThrow(ValidationError);
        });
    });
});
