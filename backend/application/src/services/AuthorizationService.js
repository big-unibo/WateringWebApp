import { isRoleAtLeast } from "../commons/permissionRoles.js";

class AuthorizationService {

	constructor(userService, authorizationRepository) {
		this.userService = userService
		this.authorizationRepository = authorizationRepository
	}

	async getAvailableEntityIds(userId, entity, min_role){
		if(await this.userService.isAdmin(userId)) return ['ALL']
		const availableIds = await this.authorizationRepository.getUserAvailableIds(userId, entity)
		return [...new Set(availableIds.filter(({role}) => isRoleAtLeast(role, min_role)).map(({id}) => id))]
	}

	async isUserAuthorized(userId, requiredRole, entity = null, id = null, service = null
	) {
		if (await this.userService.isAdmin(userId)) return true
		const userRoles = await this.authorizationRepository.getUserRoles(userId, entity, id, service)
		if (userRoles && userRoles.length > 0) {
			return userRoles.some(({ role }) => isRoleAtLeast(role, requiredRole))
		}
		return false		
	}
}

export default AuthorizationService