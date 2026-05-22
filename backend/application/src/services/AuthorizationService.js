import { COMPANIES_PERMITS_COLUMN_MAPPING, isRoleAtLeast } from "../commons/permissionRoles.js";
import { TABLES } from "../commons/constants.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

class AuthorizationService {

    constructor(userService, authorizationRepository, userActionService) {
        this.userService = userService
        this.authorizationRepository = authorizationRepository
        this.userActionService = userActionService
    }

    async getAvailableEntityIds(userId, entity, min_role, isAdmin = false, service = null) {
        if (isAdmin) return ['ALL']
        let availableIds = []
        if (entity in COMPANIES_PERMITS_COLUMN_MAPPING) {
            availableIds = await this.authorizationRepository.getUserFieldAvailableIds(userId, entity, service)
        } else {
            availableIds = await this.authorizationRepository.getUserDeviceAvailableIds(userId, entity)
        }
        return [...new Set(availableIds.filter(({ role }) => isRoleAtLeast(role, min_role)).map(({ id }) => id))]
    }

    async isUserAuthorized(userId, requiredRole, isAdmin = false, entity = null, id = null, service = null
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

    async grantUser(userId, targetUserId, role, entityType, entityId, extraAttributes) {
        if (((role === 'accounter' && entityType === 'COMPANY') || (role !== 'accounter' && entityType === 'SECTOR')) && !(role !== 'accounter' && await this.isUserAuthorized(targetUserId, 'accounter', false, entityType, entityId))) {
            await this.deleteUserPermission(userId, targetUserId, entityType, entityId)
            const permit = await this.authorizationRepository.grantUser(targetUserId, entityType, entityId, role, extraAttributes)
            if (permit?.id) {
                await this.userActionService.logCreation(userId, TABLES.PERMIT, permit.id)
            }
        } else {
            throw Error("Invalid authorization requested")
        }
    }

    async deleteUserPermission(userId, targetUserId, entityType, entityId) {
        try {
            const deletedPermitIds = await this.authorizationRepository.removeOldPermits(targetUserId, entityType, entityId)
            if (deletedPermitIds) {
                await this.userActionService.logDeletion(userId, TABLES.PERMIT, deletedPermitIds)
            }
        } catch (error) {
            console.error(`Error deleting user permission: ${error.message}`);
            throw error;
        }
    }

    async getResourceRelatedPermissions(entityType, entityId) {
        const res = await this.authorizationRepository.getResourceRelatedPermissions(entityType, entityId)
        return dtoConverter.convertUsersResourcePermits(res)
    }

    async getCompanyUsers(companyId) {
        const res = await this.authorizationRepository.getCompanyUsers(companyId)
        return dtoConverter.convertUserRoles(res)
    }
}

export default AuthorizationService