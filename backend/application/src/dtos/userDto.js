export class Users{
  constructor(users) {
    this.users = users;
  }
}

export class User {
  constructor(email, name, password) {
    this.email = email
    this.password = password
    this.name = name
  }
}

export class UserPermission {
  constructor(role, resource, id, services){
    this.role = role
    this.resource = resource
    this.id = id
    this.services = services
  }
}
