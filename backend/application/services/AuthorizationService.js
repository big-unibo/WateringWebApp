class AuthorizationService {

  constructor(userService) {
    this.userService = userService;
  }

  // async isUserAuthorized(userid, permission, timestampFrom, timestampTo) {
  //   const userPermissions = await this.userService.findUserPermissions(userid, timestampFrom, timestampTo)
  //   if(userPermissions.role === 'admin') return true;
  //   return permission === userPermissions.role
  // }

  // async isUserAuthorizedByFieldAndId(userid, refStructureName, companyName, fieldName, sectorName, thesisName, action, timestampFrom, timestampTo) {
  //   const userPermissions = await this.userService.findUserPermissions(userid, timestampFrom, timestampTo);

  //   if (userPermissions.role === "admin") return true;
  //   if (!userPermissions.permissions || userPermissions.permissions.length === 0)
  //     return false;

  //   for (const field of userPermissions.permissions) {
  //     const match =
  //       field.refStructureName === refStructureName &&
  //       field.companyName === companyName &&
  //       field.fieldName === fieldName &&
  //       field.sectorName === sectorName &&
  //       (
  //         !thesisName || field.thesisName === thesisName
  //       );

  //     if (match) {
  //       return field.permissions.includes(action);
  //     }
  //   }

  //   return false;
  // }

  async isUserAuthorizedById(userId, permit, table, id_key) {
    const userPermissions = await this.userService.findUserPermissions(userId);

    if (!userPermissions) return false;
    if (userPermissions.role === 'admin') return true;

    return userPermissions.permissions.some(p =>
      p.permit === permit &&
      p.table === table &&
      p.id_keys.includes(id_key)
    );
  }

}

export default AuthorizationService