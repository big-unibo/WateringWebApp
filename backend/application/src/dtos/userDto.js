export class Users{

  constructor(users) {
    this.users = users;
  }

}

export class User {

  constructor(email, password, name, role) {
    this.email = email
    this.password = password
    this.name = name
    this.role = role
  }

}

export class UserData {
  constructor(email, name, role) {
    this.email = email;
    this.name = name;
    this.role = role;
  }
}
