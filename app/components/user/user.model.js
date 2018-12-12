const db = require('../../db/');
const userModel = require('../../models/userModel');
const scoreModel = require('../../models/scoreModel');
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
         console.log(queryString);
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
