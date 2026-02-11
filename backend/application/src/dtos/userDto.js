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
