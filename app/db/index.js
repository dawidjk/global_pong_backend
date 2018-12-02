const { Pool } = require('pg');
const config = require('../../config/');

const pool = new Pool({
    user: config.dbConfig.getUser(),
    host: config.dbConfig.getHost(),
    database: config.dbConfig.getDatabase(),
    password: config.dbConfig.getPassword(),
    port: config.dbConfig.getPort(),
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
});

const poolStatus = function () {
    // console.log(` Pool total count ${pool.totalCount}`);
    // console.log(`Pool total idle count ${pool.idleCount}`);
    // console.log(`Pool waiting count ${pool.idleCount}`);
};

pool.on('connect', (newClient) => {
    // /*console.log('new client connected');
    // poolStatus();*/
});

pool.on('acquire', (newClient) => {
    // /*console.log('new client aquired');
    // poolStatus();*/
});

pool.on('error', (err, newClient) => {
    console.log(`Error ${err}`);
    poolStatus();
});

pool.on('remove', (newClient) => {
// /*    console.log('Client removed');
//     poolStatus();*/
});

module.exports = pool;
