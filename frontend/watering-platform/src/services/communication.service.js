import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_ADDRESS
});

const wateringAdviceEndpoint = 'wateringAdvice'

class AuthService {

    authHeader() {
        const tokenItem = localStorage.getItem('appToken')
        const token = JSON.parse(tokenItem);
        if (token)
            return token;
        else return undefined;
    }

    async getWateringAdvice(token, thesisId, timestamp, expectedWater = null) {
        const params = {
            timestamp: timestamp
        };

        if (expectedWater !== null && expectedWater !== undefined) {
            params.expectedWater = expectedWater;
        }

        return await axiosInstance.get(`/theses/${thesisId}/${wateringAdviceEndpoint}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            },
            params: params
        }).then(response => {
            if (response.data)
                return response.data
        }).catch(error => {
            console.log(error)
            console.error(`Get watering advice request request failed: ${error.message}`)
        });
    }

}

export default new AuthService();