class Config {
    constructor(){
    }
    getPort(){
        return process.env.port? process.env.port: 7877
    }
    getPassportJWTSecretKey(){
        return 'AqBsU#092!883$MmUt';
    }
    getTokenExpirationTime(){
        return 3600;
    }
}

class PostgresConfig {
    getUser(){ return 'gps_pong' }
    getHost(){ return '172.104.23.124' } //localhost //'45.33.86.76' //'172.104.30.67'
    getDatabase(){ return 'gps_pong' }
    getPassword(){ return 'gps_pong'  } // TODO: Encrypt the password
    getPort(){ return 5432 }
}

let config = new Config();
let dbConfig = new PostgresConfig();

module.exports = {
    serverConfig: config,
    dbConfig: dbConfig
}