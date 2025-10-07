export class UserPermitDto {
	/**
	 * @param {string} permit - The type of permit.
	 * @param {string} table - The table or resource the permit applies to.
	 * @param {Array<number>} idKeys - Array of IDs on which the permit is valid.
	 */
	constructor(permit, table, idKeys = []) {
		this.permit = permit;   
		this.table = table;    
		this.idKeys = idKeys;   
	}
}

export class UserPermitsDto {
	/**
	 * @param {number} userId - The ID of the user.
	 * @param {string} role - The role of the user (e.g., 'admin', 'user').
	 * @param {Array<UserPermitDto>} permits - Array of UserPermitDto objects.
	 */
	constructor(userId, role, permits = []) {
		this.userId = userId;       
		this.role = role;           
		this.permits = permits;     
	}
}