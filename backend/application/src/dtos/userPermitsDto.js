export class UserRole {
	/**
	 * @param {string} role - The type of permit.
	 * @param {string} table - The table or resource the permit applies to.
	 * @param {Array<number>} idKeys - Array of IDs on which the permit is valid.
	 */
	constructor(role, table, idKeys = []) {
		this.role = role;   
		this.table = table;    
		this.idKeys = idKeys;   
	}
}

export class UserPermits{
	/**
	 * @param {number} userId - The ID of the user.
	 * @param {boolean} isAdmin - Flag that indicates if the isure is administrator.
	 * @param {Array<UserRole>} roles - Array of UserPermit objects.
	 */
	constructor(userId, isAdmin, roles = []) {
		this.userId = userId;       
		this.isAdmin = isAdmin;           
		this.roles = roles;     
	}
}