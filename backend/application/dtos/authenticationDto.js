export class UserTokenRequest {

    constructor(username, password, affiliation, auth_type) {
        this.username = username;
        this.password = password;
        this.affiliation = affiliation;
        this.auth_type = auth_type;
    }

}

export class UserTokenResponse {

    constructor(token) {
        this.token = token;
    }

}