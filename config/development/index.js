class Config {
    constructor(){
    }
    getPort(){
        return process.env.port? process.env.port: 3000
    }
    getPassportJWTSecretKey(){
        return 'AqBsU#092!883$MmUt';
    }
    getTokenExpirationTime(){
        return 3600;
    }
}

class PostgresConfig {
    getUser(){ return 'postgres' }
    getHost(){ return 'localhost' } //localhost //'45.33.86.76' //'172.104.30.67'
    getDatabase(){ return 'bachend_database' }
    getPassword(){ return 'backend_password'  } // TODO: Encrypt the password
    getPort(){ return 5432 }
}

let config = new Config();
let dbConfig = new PostgresConfig();

module.exports = {
    serverConfig: config,
    dbConfig: dbConfig
}