import { isRoleAtLeast, ROLES } from "../commons/permissionRoles.js";
import { UserPermission } from "../dtos/userDto.js";

class AuthorizationService {

	constructor(userService, sectorServicesService, authorizationRepository) {
		this.userService = userService
		this.sectorServicesService = sectorServicesService
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
		const userRoles = await this.authorizationRepository.getUserRolesAndServices(userId, entity, id)
		if (userRoles && userRoles.length > 0) {
			return userRoles.filter(({services}) => services.include(service)).some(({ role }) => isRoleAtLeast(role, requiredRole))
		}
		return false		
	}

	async getUserPermissions(userId, entity, id) {
		if (await this.userService.isAdmin(userId)){
			const services = await this.sectorServicesService.getServices()
			return new UserPermission(ROLES.ADMINISTRATOR, entity, id, services.map(({name}) => name))
		}
		const userRoles = await this.authorizationRepository.getUserRolesAndServices(userId, entity, id)
		
	}
}

export default AuthorizationService