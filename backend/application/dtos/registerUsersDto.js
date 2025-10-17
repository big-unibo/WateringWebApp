export class RegisterUsers{

  constructor(users) {
    this.users = users;
  }

}

export class RegisterUser {

  constructor(email, password, name, role) {
    this.email = email
    this.password = password
    this.name = name
    this.role = role
  }

}
