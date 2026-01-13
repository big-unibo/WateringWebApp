export class UserTokenRequest {

    constructor(email, password) {
        this.email = email;
        this.password = password;
    }

}

export class UserTokenResponse {

    constructor(token) {
        this.token = token;
    }

}