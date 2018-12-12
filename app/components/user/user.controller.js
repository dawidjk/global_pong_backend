/* eslint-disable no-underscore-dangle */
const User = require('./user.model');
const jwt = require('jsonwebtoken');
const config = require('../../../config/');
const responseService = require('../../utils/ResponseService');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const async = require('async');
const moment = require('moment-timezone');
const logger = require('../../utils/logging');

// TODO: Put this into helper file
function _generateToken(data) {
    return new Promise(((resolve, reject) => {
        try {
            const payload = {
                application_user_id: data.application_user_id,
            };

            const token = jwt.sign(payload, config.serverConfig.getPassportJWTSecretKey(), {
                expiresIn: config.serverConfig.getTokenExpirationTime(),
            });

            const result = {
                application_user_id: data.application_user_id,
                token,
            };
            resolve(result);
        } catch (e) {
            reject(e);
        }
    }));
}

function _generateSalt() {
    return crypto.randomBytes(16).toString('base64');
}

function _encryptPassword(userPassword, salt) {
    if (!userPassword || !salt) {
        return '';
    }
    salt = new Buffer(salt, 'base64');
    const password = crypto.pbkdf2Sync(userPassword, salt, 10000, 64, 'sha1').toString('base64');
    return password;
}

function _checkPassword(data) {
    return new Promise(((resolve, reject) => {
        const password = data.user_password; // password in database
        const userPassword = data.userPassword; // password provided by end user
        const salt = data.salt; // salt stored in database
        const encryptedPassword = _encryptPassword(userPassword, salt); // create hash of userPassword and salt
        if (encryptedPassword === password) {
            resolve({
                application_user_id: data.application_user_id,
            });
        } else {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject('Wrong password');
        }
    }));
}

// TODO: Add Validation for request parameters using Joi library
exports.getAuthorization = function (req, res) {
    const username = req.body.username || '';
    const password = req.body.password || '';

    if (username && password) {
        User
            .checkCredentials(username, password)
            .then(_checkPassword)
            .then(_generateToken)
            .then((result) => {
                logger.log('info', `${username} logged in successfully`);
                console.log("finding user");
                console.log(result);
                responseService.send({
                    status: responseService.getCode().codes.OK,
                    data: result
                }, res);
            })
            .catch((err) => {
                const user = {
                        user_email: username,
                        user_password: '',
                        salt: _generateSalt(),
                        score: 0,
                    };
                    user.user_password = _encryptPassword(password, user.salt);
                    User
                        .registerUser(user)
                        .then((result) => {
                            User
                                .checkCredentials(username, password)
                                .then(_checkPassword)
                                .then(_generateToken)
                                .then((result) => {
                                    responseService.send({
                                        status: responseService.getCode().codes.OK,
                                        data: result
                                    }, res);
                                })
                        })
                        .catch((err) => {
                            responseService.send({
                                status: responseService.getCode().codes.FAILURE,
                                data: err,
                            }, res);
                        });
            });
    } else {
        responseService.send({
            status: responseService.getCode().codes.BAD_REQUEST,
            data: 'Please provide username and password',
        }, res);
    }
};

exports.getUser = function (req, res) {
    const userId = req.query.userId || '';
    if (userId) {
        User
            .getUser(userId)
                .then(result =>{
                    console.log(result);
                    responseService.send({
                    status: responseService.getCode().codes.OK,
                    data: result,
                }, res)
            })
            .catch(err => responseService.send({
                status: responseService.getCode().codes.FAILURE,
                data: err,
            }, res));
    } else {
        return responseService.send({
            status: responseService.getCode().codes.FAILURE,
            data: 'Not all data was provided',
        }, res);
    }
};

exports.registerUser = function (req, res) {
    const email = req.body.email || '';
    const password = req.body.password || '';
    if (email && password) {
        const user = {
            user_email: email,
            user_password: '',
            salt: _generateSalt(),
            score: 0,
        };
        user.user_password = _encryptPassword(password, user.salt);
        User
            .registerUser(user)
            .then((result) => {
                responseService.send({
                    status: responseService.getCode().codes.OK,
                    data: {userID: user.application_user_id},
                }, res);
            })
            .catch((err) => {
                logger.log('error', ` Error while registering ${email}, the error is ${err}`);
                responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                    data: err,
                }, res);
            });
    } else {
        return responseService.send({
            status: responseService.getCode().codes.FAILURE,
            data: 'Not all data was provided',
        }, res);
    }
};

