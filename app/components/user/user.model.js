const db = require('../../db/');
const userModel = require('../../models/userModel');
const scoreModel = require('../../models/scoreModel');
const gpsModel = require('../../models/gpsModel');
const logger = require('../../utils/logging');

// TODO: Read all the columns and tables from model
exports.getUser = function (applicationUserId) {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT ${userModel.id}, ${userModel.email}, 
         ${userModel.salt}, ${userModel.password}, ${userModel.score} 
         FROM ${userModel.collectionName} where ${userModel.id} = ${applicationUserId}`;
        db.query(queryString, (err, res) => {
            if (err) {
                logger.log('error', ` getUser - ${applicationUserId} - ${err}`);
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.getCoastScore = function () {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT *
         FROM ${scoreModel.collectionName}`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows);
            }
        });
    }));
};

exports.getVector = function () {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT *
         FROM vector`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.getCoordinates = function () {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT *
         FROM ${gpsModel.collectionName} ORDER BY ${gpsModel.id} DESC LIMIT 1`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.getUserScore = function () {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT score
         FROM ${userModel.collectionName}`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.getUserByEmail = function (userEmail) {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT ${userModel.id}
         FROM ${userModel.collectionName} where ${userModel.email} = '${userEmail}'`;
        db.query(queryString, (err, res) => {
            if (err) {
                logger.log('error', ` getUserByEmail - ${userEmail} - ${err}`);
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.checkCredentials = function (username, password) {
    return new Promise(((resolve, reject) => {
        // TODO: Add isActive checker and password checking
        const queryString = `SELECT ${userModel.id}, ${userModel.password}, ${userModel.salt} FROM 
        ${userModel.collectionName} WHERE ${userModel.email} = '${username}'`; // + '" and user_password = "' + password+'"';
        db.query(queryString, (err, res) => {
            if (err) {
                logger.log('error', ` checkCredentials - ${username} - ${err}`);
                reject(err);
            } else if (res.rowCount === 0) {
                // user does not exist
                // eslint-disable-next-line prefer-promise-reject-errors
               //  reject('Email does not exist');
               resolve(null);
            } else {
                // TODO: Log an error if multiple accounts exists with same email address
                res.rows[0].userPassword = password;
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.registerUser = function (user) {
    return new Promise(((resolve, reject) => {
        const queryString = `INSERT INTO ${userModel.collectionName}(
         ${userModel.password},${userModel.email}, ${userModel.salt}, ${userModel.score})
         VALUES('${user.user_password}', '${user.user_email}', '${user.salt}', 0) RETURNING *`;
        db.query(queryString, (err, res) => {
            if (err) {
                console.log(err);
                logger.log('error', ` registerUser - ${user} - ${err}`);
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.setCoordinates = function (lat, lon) {
    return new Promise(((resolve, reject) => {
        const queryString = `INSERT INTO ${gpsModel.collectionName}(
         ${gpsModel.lat},${gpsModel.lon})
         VALUES(${lat}, ${lon}) RETURNING *`;
        db.query(queryString, (err, res) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.updatePassword = function (applicationUserId, password, salt, updatedAt) {
    return new Promise(((resolve, reject) => {
        const queryString = `UPDATE ${userModel.collectionName} 
        SET ${userModel.password} = '${password}', ${userModel.salt} = '${salt}', ${userModel.updatedAt} = '${updatedAt}'
        WHERE ${userModel.id} = ${applicationUserId} 
        AND ${userModel.isActive} is true`;
        db.query(queryString, (err, res) => {
            if (err) {
                logger.log('error', ` updateUser - ${applicationUserId} - ${err}`);
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};
exports.incrementVector = function (iteration) {
    return new Promise(((resolve, reject) => {
        const queryString = `UPDATE vector
        SET itterations = ${iteration}`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.victor = function (coast) {
    return new Promise(((resolve, reject) => {
        const queryString = `UPDATE score
        SET score = score + 1 WHERE coast = '${coast}'`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.updateVector = function (hAcc, h, vAcc, v, iteration) {
    return new Promise(((resolve, reject) => {
        const queryString = `UPDATE vector
        SET hacc = ${hAcc}, h = ${h}, vacc = ${vAcc}, v = ${v}, itterations = ${iteration} RETURNING *`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.deleteCoordinates = function () {
    return new Promise(((resolve, reject) => {
        const queryString = `DELETE FROM gps`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.addResetToken = function (token) {
    return new Promise(((resolve, reject) => {
        const queryString = `INSERT INTO ${resetPassModel.collectionName}(
         ${resetPassModel.token}, ${resetPassModel.applicationUserId},
         ${resetPassModel.createdAt})
         VALUES('${token.token}', '${token.applicationUserId}',
         '${token.createdAt}') RETURNING *`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};
