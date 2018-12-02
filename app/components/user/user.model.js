const db = require('../../db/');
const userModel = require('../../models/userModel');
const resetPassModel = require('../../models/resetPassModel');
const shadowUserModel = require('../../models/shadowUserModel');
const logger = require('../../utils/logging');

// TODO: Read all the columns and tables from model
exports.getUser = function (applicationUserId) {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT ${userModel.id},
         ${userModel.firstName}, ${userModel.lastName}, 
         ${userModel.displayName},${userModel.email}, ${userModel.provider},
         ${userModel.isActive}, ${userModel.hasAgreedTOS}, ${userModel.image},
         ${userModel.createdAt}, ${userModel.updatedAt}, ${userModel.salt}, ${userModel.password} 
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

exports.getUserByEmail = function (userEmail) {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT ${userModel.id},
         ${userModel.firstName}, ${userModel.lastName}, 
         ${userModel.displayName},${userModel.email}, 
         ${userModel.isActive}, ${userModel.hasAgreedTOS}, ${userModel.image},
         ${userModel.createdAt}, ${userModel.updatedAt} 
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
        ${userModel.collectionName} WHERE ${userModel.email} = '${username}' and is_active = true`; // + '" and user_password = "' + password+'"';
        db.query(queryString, (err, res) => {
            if (err) {
                logger.log('error', ` checkCredentials - ${username} - ${err}`);
                reject(err);
            } else if (res.rowCount === 0) {
                // user does not exist
                // eslint-disable-next-line prefer-promise-reject-errors
                reject('Email does not exist');
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
         ${userModel.firstName}, ${userModel.lastName}, ${userModel.password},
         ${userModel.displayName},${userModel.email}, ${userModel.provider}, ${userModel.salt},
         ${userModel.isActive}, ${userModel.hasAgreedTOS}, ${userModel.image}, 
         ${userModel.createdAt})
         VALUES('${user.first_name}','${user.last_name}', '${user.user_password}',
         '${user.display_name}', '${user.user_email}', '${user.provider}', '${user.salt}',
            ${user.is_active}, ${user.agreed_tos}, '${user.profile_image_url}', '${user.created_at}') RETURNING *`;
        db.query(queryString, (err, res) => {
            if (err) {
                logger.log('error', ` registerUser - ${user} - ${err}`);
                reject(err);
            } else {
                resolve(res.rows[0]);
            }
        });
    }));
};

exports.updateUser = function (applicationUserId, updates, updatedAt) {
    return new Promise(((resolve, reject) => {
        const queryString = `UPDATE ${userModel.collectionName} 
        SET ${userModel.firstName} = '${updates.first_name}', ${userModel.lastName} = '${updates.last_name}', ${userModel.displayName} = '${updates.display_name}', ${userModel.email} = '${updates.user_email}', ${userModel.updatedAt} = '${updatedAt}'
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

exports.addShadow = function (appUserId, opCode, operatedOn, fieldName, oldValue, newValue) {
    return new Promise(((resolve, reject) => {
        const queryString = `INSERT INTO ${shadowUserModel.collectionName}(
            ${shadowUserModel.applicationUserId}, ${shadowUserModel.operationCode}, ${shadowUserModel.createdAt}, ${shadowUserModel.fieldName}, ${shadowUserModel.oldValue}, ${shadowUserModel.newValue}) 
            VALUES(${appUserId}, '${opCode}', '${operatedOn}', '${fieldName}', '${oldValue}', '${newValue}')`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve({ Message: 'Successfully added shadow' });
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
