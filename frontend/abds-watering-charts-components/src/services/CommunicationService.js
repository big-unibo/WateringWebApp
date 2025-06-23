import axios from "axios";
import { getNestedProperty } from "../common/utils";

export class CommunicationService {

    async getChartData(environment, pathsParams, queryParams, endpoint, dataKey) {
        const response = await this.getAPI(environment, "/fieldCharts", pathsParams, queryParams, endpoint);
        if (response) {
            return getNestedProperty(response, dataKey);
        }
        return null;
    }

    async getAPI(environment, primaryPath, pathsParams, queryParams, endpoint) {
        return axios.get(this.buildURL(environment.host, primaryPath, pathsParams, endpoint), {
            params: queryParams,
            headers: {
                Authorization: 'Bearer ' + environment.token
            }
        }).then(response => {
            if (response.data)
                return response.data;
            return null;
        }).catch(error => {
            console.error(`Error response: ${error}`)
            console.error(`Error on communication service: ${error.message}`)
            throw new Error(error.message);
        })
    }

    async getFieldInfo(environment, pathsParams, params, endpoint) {
        const response = await this.getAPI(environment, "/fields", pathsParams, params, endpoint)
        return response;
    }

    async getWateringSchedule(environment, pathsParams, params, endpoint) {
        const response = await this.getAPI(environment, "/wateringSchedule", pathsParams, params, endpoint)
        return response;
    }

    async updateEvent(environment, endpoint, thesisIdentifier, newEvent) {
        return axios.put(this.buildURL(environment.host, "/wateringSchedule", undefined, endpoint), {
            refStructureName: thesisIdentifier.refStructureName,
            companyName: thesisIdentifier.companyName,
            fieldName: thesisIdentifier.fieldName,
            sectorName: thesisIdentifier.sectorName,
            plantRow: thesisIdentifier.plantRow,
            ...newEvent
        }, {
            headers: {
                Authorization: 'Bearer ' + environment.token
            }
        }
        ).then(response => {
            console.log(`Success response: ${response.data}`)
            if (response.data)
                return response.data;
            return null;
        }).catch(error => {
            console.error(`Error response: ${error}`)
            console.error(`Error on communication service: ${error.message}`)
            throw new Error(error.message);
        })
    }

    async setOptimalStateByTimestamp(environment, endpoint, thesisIdentifier, timestamp){
        return axios.put(this.buildURL(environment.host, "/fields",thesisIdentifier,endpoint),{},{
            params: {
                timestamp: timestamp
            },
            headers: {
                Authorization: 'Bearer ' + environment.token
            }
        }).then(response => {
            console.log(`Success response: ${response.data}`)
            if (response.data)
                return response.data;
            return null;
        }).catch(error => {
            console.error(`Error response: ${error}`)
            console.error(`Error on communication service: ${error.message}`)
            throw new Error(error.message);
        })
    }

    buildURL(host, primaryPath, pathsParams, endpoint) {
        let path = ""
        if (pathsParams) {
            path = '/' + pathsParams.refStructureName + '/' + pathsParams.companyName + '/' + pathsParams.fieldName + '/' + pathsParams.sectorName + '/' + pathsParams.plantRow
        }
        return host + primaryPath + path + '/' + endpoint;

    }

}