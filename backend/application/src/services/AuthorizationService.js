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

	async isUserAuthorized(userId, requiredRole, entity = null, id = null)
	{
		if(await this.userService.isAdmin(userId)) return true
		if (entity != null && id != null) {
			const userRole = await this.authorizationRepository.getUserRole(userId, entity, id)
			if (userRole && userRole.length > 0) {
				return isRoleAtLeast(userRole[0].role, requiredRole)
			}
		}
		return false		
	}
}

export default AuthorizationService