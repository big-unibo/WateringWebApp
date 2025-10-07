class AuthorizationService {

	constructor(userService, fieldService) {
		this.userService = userService;
		this.fieldService = fieldService
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

	async isUserAuthorizedById(userId, permit, table, idKey) {
		const userPermissions = await this.userService.findUserPermissions(userId);
		if (!userPermissions || !Array.isArray(userPermissions.permits)) return false;
		if (userPermissions.role === 'admin') return true;

		return userPermissions.permits.some(p =>
			p.permit === permit &&
			p.table === table &&
			p.idKeys.includes(idKey)
		);
	}

	/* User allowed if it has a permit of given type for the company owning the given sector*/ 
	async isUserAuthorizedInSector(userId, permit, sectorId) {
		const company = await this.fieldService.getSectorOwner(sectorId);
		const companyId = company.companyId;
		return this.isUserAuthorizedById(userId, permit, 'companies',companyId );
	}

	/* User allowed if it has a permit of given type for the company owning the given sector*/ 
	async isUserAuthorizedInField(userId, permit, fieldId) {
		const company = await this.fieldService.getFieldOwner(fieldId);
		const companyId = company.companyId;
		return this.isUserAuthorizedById(userId, permit, 'companies',companyId );
	}
}

export default AuthorizationService