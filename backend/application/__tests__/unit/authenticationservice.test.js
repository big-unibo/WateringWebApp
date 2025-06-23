const AuthenticationService = require('../../services/AuthenticationService');
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

describe('AuthenticationService', () => {
    let authService;
    let mockUserService;

    beforeEach(() => {
        mockUserService = {
            findUser: jest.fn()
        };
        authService = new AuthenticationService(mockUserService);
    });

    describe('generateJwt', () => {
        it('should generate a valid token for user with password authentication', async () => {
            mockUserService.findUser.mockResolvedValue({
                dataValues: { userid: 'user123', affiliation: 'affiliation123', auth_type: 'pwd', pwd: 'hashedPassword' }
            });
            const request = { username: 'user@example.com', password: 'hashedPassword' };
            // Mocking jwt.sign behavior
            jwt.sign.mockReturnValue('generated.jwt.token');

            const token = await authService.generateJwt(request);
            expect(token).toBe('generated.jwt.token');
            expect(jwt.sign).toHaveBeenCalledWith(
              expect.any(Object),
              expect.any(String),
              { expiresIn: '1w' }
            );
        });

        it('should generate a valid token for user with token authentication', async () => {
            mockUserService.findUser.mockResolvedValue({
                dataValues: { userid: 'user123', affiliation: 'affiliation123', auth_type: 'token' }
            });
            const request = { username: 'user@example.com', affiliation: 'affiliation123' };
            jwt.sign.mockReturnValue('generated.jwt.token');

            const token = await authService.generateJwt(request);
            expect(token).toBe('generated.jwt.token');
        });

        it('should throw an error if password is invalid for pwd authentication user', async () => {
            mockUserService.findUser.mockResolvedValue({
                dataValues: { pwd: 'correctPassword', auth_type: 'pwd' }
            });
            const request = { username: 'user@example.com', password: 'wrongPassword' };

            await expect(authService.generateJwt(request))
              .rejects.toThrow('Password is invalid');
        });

    });

    describe('validateJwt', () => {
        it('should validate a correct token', async () => {
            const testToken = 'some.jwt.token';
            const testDecoded = { user: '123', affiliation: 'test', auth_type: 'token' };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, testDecoded);
            });

            const result = await authService.validateJwt(`Bearer ${testToken}`);
            expect(result).toEqual(testDecoded);
        });

        it('should throw an error for an undefined header', async () => {
            await expect(authService.validateJwt(undefined))
              .rejects.toThrow('Authentication failed: bearer header not found.');
        });

    });
});
