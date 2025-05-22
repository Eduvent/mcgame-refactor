// tests/integration/api/auth.test.js - Test de integración API
const request = require('supertest');
const Server = require('../../../src/server');

describe('Auth API Integration', () => {
    let server;
    let app;

    beforeAll(async () => {
        server = new Server();
        await server.initialize();
        app = server.app;
    });

    afterAll(async () => {
        if (server.server) {
            server.server.close();
        }
    });

    describe('POST /api/auth/register', () => {
        const validUserData = {
            name: 'John Doe',
            email: 'john@example.com',
            dni: '12345678',
            phone: '987654321'
        };

        it('should register user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe(validUserData.email);
        });

        it('should return 409 when user already exists', async () => {
            // Register user first
            await request(app)
                .post('/api/auth/register')
                .send(validUserData);

            // Try to register same user again
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should return 400 for invalid data', async () => {
            const invalidData = {
                name: 'J', // Too short
                email: 'invalid-email',
                dni: '123', // Too short
                phone: '123' // Too short
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    dni: '87654321',
                    phone: '912345678'
                });
        });

        it('should login with email successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe('test@example.com');
        });

        it('should login with DNI successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ dni: '87654321' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let authToken;

        beforeEach(async () => {
            // Register and login to get token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Profile Test User',
                    email: 'profile@example.com',
                    dni: '11111111',
                    phone: '911111111'
                });

            authToken = registerResponse.body.data.token;
        });

        it('should get profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('profile@example.com');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
