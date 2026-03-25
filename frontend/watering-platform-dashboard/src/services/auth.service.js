import axios from 'axios'
import hashPassword from '@/utils/hashPassword';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_ADDRESS
});

class AuthService {

    isUserLoggedIn() {
        const token = JSON.parse(localStorage.getItem('appToken'));
        return !!token;
    }

    async login(user) {
        try {
            const response = await axiosInstance.post('/users/login', {
                email: user.authEmail,
                password: hashPassword(user.authPass),
            });
            if (response.data.token) {
                localStorage.setItem('appToken', JSON.stringify(response.data.token));
            }
        } catch (error) {
            console.log(error);
            throw Error(`Authentication failed: ${error.message}`);
        }
    }

    logout(){
        localStorage.removeItem('appToken');
    }

    authHeader(){
        const tokenItem = localStorage.getItem('appToken')
        const token = JSON.parse(tokenItem);
        if(token)
            return token;
        else return undefined;
    }

    async retrieveUserSectors(token, timeFilterFrom = null, timeFilterTo = null) {
        let params = undefined
        if (timeFilterFrom && timeFilterTo) {
            params = { timeFilterFrom: timeFilterFrom, timeFilterTo: timeFilterTo }
        }
        return await axiosInstance.get('/sectors', {
            headers: {
                'Authorization': 'Bearer ' + token
            },
            params: params
        }).then(response => {
            if (response.data)
                return response.data
        }).catch(error => {
            console.log(error)
            console.error(`Get fields request failed: ${error.message}`)
            this.logout()
        });
    }

    async retrieveUserData(token) {
        return await axiosInstance.get('/users/me', {
            headers: {
                'Authorization': 'Bearer ' + token
            },
        }).then(response => {
            if (response.data)
                return response.data
        }).catch(error => {
            console.log(error)
            console.error(`Get fuser data request failed: ${error.message}`)
            this.logout()
        });
    }

}

export default new AuthService();