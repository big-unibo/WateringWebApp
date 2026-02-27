import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_ADDRESS
});

const wateringAdviceEndpoint = 'wateringAdvice'

export class CommunicationService {

    authHeader() {
        const tokenItem = localStorage.getItem('appToken')
        const token = JSON.parse(tokenItem);
        if (token)
            return token;
        else return undefined;
    }

    _handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const serverMessage = error.response.data?.message || error.response.statusText;

            console.warn(`API Error [${status}]:`, serverMessage);

            throw {
                isNetworkError: false,
                status: status,
                message: serverMessage,
                originalError: error.response.data
            };
        }

        else if (error.request) {
            console.error("Network Error: No response received", error.message);
            throw {
                isNetworkError: true,
                message: "Impossibile contattare il server. Verifica la connessione.",
                status: 0
            };
        }

        else {
            console.error("Request Setup Error", error.message);
            throw {
                isNetworkError: false,
                message: "Errore interno dell'applicazione.",
                status: -1
            };
        }
    }

    async getWateringAdvice(environment, endpoint, paths, params) {
        const thesisId = paths.thesisId
        const token = environment.token
        try {
            const response = await axiosInstance.get(`/theses/${thesisId}/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: params
            });
            return response.data;

        } catch (error) {
            return this._handleError(error)
        }
    }

    async setOptimalStateByMatrixId(environment, endpoint, paths, matrixId) {
        const thesisId = paths.thesisId
        const token = environment.token
        try {
            const response = await axiosInstance.put(`/theses/${thesisId}/${endpoint}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: { optimalProfileId: matrixId }
            });
            return response.data;
        } catch (error) {
            return this._handleError(error)
        }
    }

    async setOptimalStateByTimestamp(environment, endpoint, paths, selectedTimestamp) {
        const thesisId = paths.thesisId
        const token = environment.token
        try {
            const response = await axiosInstance.put(`/theses/${thesisId}/${endpoint}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    thesisId: thesisId,
                    imageTimestamp: selectedTimestamp
                }
            });
            return response.data;
        } catch (error) {
            return this._handleError(error)
        }
    }

    async getLogs(environment, endpoint, paths, params) {
        const thesisId = paths.thesisId
        const token = environment.token
        const timefilters = {
            timeFilterFrom: params.timeFilterFrom,
            timeFilterTo: params.timeFilterTo
        }
        try {
            const response = await axiosInstance.get(`/logs/${thesisId}/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: timefilters
            });
            return response.data;

        } catch (error) {
            return this._handleError(error)
        }
    }
}