export class UserPermissions {

  constructor(id, role, permissions) {
    this.id = id
    this.role = role
    this.permissions = permissions
  }

}

export class UserPermission{

  constructor(permit, table, id_keys) {
    this.permit = permit,
    this.table = table,
    this.id_keys = id_keys
  }
}