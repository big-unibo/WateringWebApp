import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import { jwtSecret } from '../commons/constants.js';


class AuthenticationService {

    constructor(userService) {
        this.userService = userService;
    }

    async generateJwt(request) {
        try {
            const user = await this.userService.findUserByEmail(request.email);

            if (!user)
                throw new Error('The mail does not exist');
            
            const match = (user.dataValues.password === request.password);
            if (!match)
                throw new Error('Password is invalid');

            const payload = { userid: user.dataValues.id, name: user.dataValues.name, role: user.dataValues.role }
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
                        if (decoded.userid !== undefined && decoded.name !== undefined && decoded.role !== undefined)
                            resolve({ userid: decoded.userid, name: decoded.name, role: decoded.role });
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