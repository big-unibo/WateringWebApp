
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

  async isUserAuthorizedByFieldAndId(userid, refStructureName, companyName, fieldName, sectorName, plantRow, action, timestampFrom, timestampTo) {
    const userPermissions = await this.userService.findUserPermissions(userid, timestampFrom, timestampTo)
    if(userPermissions.role === 'admin') return true;
    if(!userPermissions.permissions || userPermissions.permissions.length === 0) return false;

    const requestedFieldKey = JSON.stringify({
      refStructureName: refStructureName,
      companyName: companyName,
      fieldName: fieldName,
      sectorName: sectorName,
      plantRow: plantRow
    });

    for(const field of userPermissions.permissions) {
      const fieldKey = JSON.stringify({
        refStructureName: field.refStructureName,
        companyName: field.companyName,
        fieldName: field.fieldName,
        sectorName: field.sectorName,
        plantRow: field.plantRow
      });

      if(requestedFieldKey === fieldKey){
        return field.permissions.includes(action)
      }
    }
    return false
  }

}

export default AuthorizationService