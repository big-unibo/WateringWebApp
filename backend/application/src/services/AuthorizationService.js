import { isRoleAtLeast } from "../commons/permissionRoles.js";

class AuthorizationService {

	constructor(userService, authorizationRepository) {
		this.userService = userService
		this.authorizationRepository = authorizationRepository
	}

	async getAvailableEntityIds(userId, entity, min_role, isAdmin = false, service = null){
		if(isAdmin) return ['ALL']
		const availableIds = await this.authorizationRepository.getUserAvailableIds(userId, entity, service)
		return [...new Set(availableIds.filter(({role}) => isRoleAtLeast(role, min_role)).map(({id}) => id))]
	}

	async isUserAuthorized(userId, requiredRole, isAdmin=false, entity = null, id = null, service = null
	) {
		if (isAdmin) return true
		const userRoles = await this.authorizationRepository.getUserRoles(userId, entity, id, service)
		if (userRoles && userRoles.length > 0) {
			return userRoles.some(({ role }) => isRoleAtLeast(role, requiredRole))
		}
		return false		
	}
}

export default AuthorizationService