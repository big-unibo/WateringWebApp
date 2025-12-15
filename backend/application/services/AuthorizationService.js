class AuthorizationService {

	constructor(userService, fieldService) {
		this.userService = userService;
		this.fieldService = fieldService
	}

	async isUserAuthorized(userId, permit, table) {
		const userPermits = await this.userService.findUserPermits(userId);
		if (!userPermits || !Array.isArray(userPermits.permits)) return false;
		if (userPermits.role === 'admin') return true;

		return userPermits.permits.some(p =>
			p.permit === permit &&
			p.table === table
		);
	}



	async isUserAuthorizedById(userId, permit, table, idKey) {
		
		const userPermits = await this.userService.findUserPermits(userId);
		if (!userPermits || !Array.isArray(userPermits.permits)) return false;
		if (userPermits.role === 'admin') return true;

		return userPermits.permits.some(p =>
			p.permit === permit &&
			p.table === table &&
			p.idKeys.includes(idKey)
		);
	}

	/* User allowed if it has a permit of given type for the company owning the given sector*/ 
	async isUserAuthorizedInSector(userId, permit, sectorId) {
		const company = await this.fieldService.getSectorOwner(sectorId);
		const companyId = company.companyId;
		return this.isUserAuthorizedById(userId, permit, 'companies', companyId);
	}

	/* User allowed if it has a permit of given type for the company owning the given sector*/ 
	async isUserAuthorizedInField(userId, permit, fieldId) {
		const company = await this.fieldService.getFieldOwner(fieldId);
		const companyId = company.companyId;
		return this.isUserAuthorizedById(userId, permit, 'companies', companyId);
	}
}

export default AuthorizationService