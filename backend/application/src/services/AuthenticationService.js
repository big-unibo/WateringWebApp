import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import { jwtSecret } from '../commons/constants.js';


class AuthenticationService {

    constructor(userService) {
        this.userService = userService;
    }

    async generateJwt(request) {
        try {
            const user = await this.userService.findUserByEmail(request.email, true);

            if (!user)
                throw new Error('The mail does not exist');
            const match = (user.password === request.password);
            if (!match)
                throw new Error('Password is invalid');
            
            const isAdmin = await this.userService.isAdmin(user.id)
            const payload = { userId: user.id, name: user.name, isAdmin: isAdmin}
            return sign(payload, jwtSecret, { expiresIn: "10h" });
        } catch (error) {
            throw new Error(`Error on generating jwt caused by: ${error}`);
        }
    }

    async validateJwt(header) {
        if (typeof header !== 'undefined' && header !== '') {
            const bearerToken = header.split(' ')[1];
            return new Promise( (resolve, reject) => {
                verify(bearerToken, jwtSecret, (err, decoded) => {
                    if (err) {
                        reject(new Error('Authentication failed: token verify error'));
                    } else {
                        if (decoded.userId !== undefined && decoded.name !== undefined)
                            resolve({ userId: decoded.userId, name: decoded.name, isAdmin: decoded.isAdmin });
                        else reject(new Error('Authentication failed: token verify error'));
                    }
                });
            });
        } else {
            throw new Error('Authentication failed: bearer header not found.');
        }
    }
}

export default AuthenticationService;