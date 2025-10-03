
import UserService from './UserService.js';

class AuthorizationService {

  constructor(sequelize) {
    this.userService = new UserService(sequelize)
  }

  async isUserAuthorized(userid, permission, timestampFrom, timestampTo) {
    const userPermissions = await this.userService.findUserPermissions(userid, timestampFrom, timestampTo)
    if(userPermissions.role === 'admin') return true;
    return permission === userPermissions.role
  }

  async isUserAuthorizedByFieldAndId(userid, refStructureName, companyName, fieldName, sectorName, thesisName, action, timestampFrom, timestampTo) {
    const userPermissions = await this.userService.findUserPermissions(userid, timestampFrom, timestampTo);

    if (userPermissions.role === "admin") return true;
    if (!userPermissions.permissions || userPermissions.permissions.length === 0)
      return false;

    for (const field of userPermissions.permissions) {
      const match =
        field.refStructureName === refStructureName &&
        field.companyName === companyName &&
        field.fieldName === fieldName &&
        field.sectorName === sectorName &&
        (
          !thesisName || field.thesisName === thesisName
        );

      if (match) {
        return field.permissions.includes(action);
      }
    }

    return false;
  }

  async isUserAuthorized(userid, permit, table) {
    const userPermissions = await this.userService.findUserPermissions(userid);
    if(userPermissions.role === 'admin') return true;

    if (!userPermissions.permissions || userPermissions.permissions.length === 0)
      return false;

    for (const field of userPermissions.permissions) {
      const match =
        field.permit === permit &&
        field.table === table;

      if (match) {
        return true;
      }
    }
    return false;
  }

}

export default AuthorizationService