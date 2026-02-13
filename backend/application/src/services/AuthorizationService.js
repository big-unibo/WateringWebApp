import { COMPANIES_PERMITS_COLUMN_MAPPING, isRoleAtLeast } from "../commons/permissionRoles.js";

class AuthorizationService {

	constructor(userService, authorizationRepository) {
		this.userService = userService
		this.authorizationRepository = authorizationRepository
	}

	async getAvailableEntityIds(userId, entity, min_role, isAdmin = false, service = null){
		if(isAdmin) return ['ALL']
		let availableIds = []
		if (entity in COMPANIES_PERMITS_COLUMN_MAPPING){
			availableIds = await this.authorizationRepository.getUserFieldAvailableIds(userId, entity, service)
		} else {
			availableIds = await this.authorizationRepository.getUserDeviceAvailableIds(userId, entity)
		}
		return [...new Set(availableIds.filter(({role}) => isRoleAtLeast(role, min_role)).map(({id}) => id))]
	}

	async isUserAuthorized(userId, requiredRole, isAdmin=false, entity = null, id = null, service = null
	) {
		if (isAdmin) return true
		let userRoles = []
		if (entity in COMPANIES_PERMITS_COLUMN_MAPPING || entity == null) { 
			userRoles = await this.authorizationRepository.getUserFieldsRoles(userId, entity, id, service)
		} else {
			userRoles = await this.authorizationRepository.getUserDeviceRoles(userId, entity, id)
		}
		if (userRoles && userRoles.length > 0) {
			return userRoles.some(({ role }) => isRoleAtLeast(role, requiredRole))
		}
		return false		
	}
}

export default AuthorizationService