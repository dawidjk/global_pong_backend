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

function _updatePosition() {
    async.forever(function(next) {
        User
        .getVector()
            .then(vector =>{
                User
                    .getCoordinates()
                        .then(coordinates =>{
                            console.log(coordinates);
                            if (coordinates == undefined) {
                                User
                                    .setCoordinates(-98.5795, 39.8283)
                                        .then(result => {
                                            next();
                                        });
                            } else if (parseFloat(coordinates.longitude) > 49.3457868 || parseFloat(coordinates.longitude) < 24.7433195) {
                                User
                                    .updateVector(vector.hacc,  vector.h, -1*vector.vacc, -1*vector.v, parseInt(vector.itterations))
                                        .then(vector => {
                                            hsign = 1;
                                            vsign = 1;
                                            if (vector.hacc != 0) {
                                                hsign = (vector.hacc/vector.hacc)
                                            }
                                            if (vector.vacc != 0) {
                                                vsign = (vector.vacc/vector.vacc)
                                            }
                                            User
                                            .setCoordinates(parseFloat(coordinates.latitude) + hsign * Math.pow(vector.hacc * parseInt(vector.itterations), 2) + vector.h, 
                                                parseFloat(coordinates.longitude) + vsign* Math.pow(vector.vacc * parseInt(vector.itterations), 2) + vector.v)
                                                .then(result => {
                                                    User
                                                        .incrementVector(parseInt(vector.itterations) + 1)
                                                            .then(result => {
                                                                next();
                                                            });
                                                });
                                        });   
                            }
                            else if (parseFloat(coordinates.latitude) > -66.9513812 || parseFloat(coordinates.latitude) < -124.784407) {
                                User
                                    .updateVector(0, 1, 0, 1, 0)
                                        .then(vector => {
                                            User
                                            .deleteCoordinates()
                                                .then(result => {
                                                    if (parseFloat(coordinates.latitude) > -66.9513812) {
                                                        User
                                                        .victor("west")
                                                            .then(result => {
                                                                next();
                                                            });
                                                    } else {
                                                        User
                                                        .victor("east")
                                                            .then(result => {
                                                                next();
                                                            });
                                                    }
                                                });
                                        });   
                            }
                            else {
                                slow = 100;
                                User
                                    .setCoordinates(parseFloat(coordinates.latitude) + Math.pow(vector.hacc * parseInt(vector.itterations), 2)/slow + vector.h/slow, 
                                        parseFloat(coordinates.longitude) + Math.pow(vector.vacc * parseInt(vector.itterations), 2)/slow + vector.v/slow)
                                        .then(result => {
                                            User
                                                .incrementVector(parseInt(vector.itterations) + 1)
                                                    .then(result => {
                                                        next();
                                                    });
                                        });
                                                    }
                    })
                    .catch(err => console.log(err));
                })
        .catch(err => console.log(err));
    });
}
_updatePosition();

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

exports.getCoordinates = function (req, res) {
    User
        .getCoordinates()
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

exports.getCoastScore = function (req, res) {
    User
        .getCoastScore()
        .then((result) => {
            console.log(result);
            responseService.send({
                status: responseService.getCode().codes.OK,
                data: result,
            }, res);
        })
        .catch((err) => {
            responseService.send({
                status: responseService.getCode().codes.FAILURE,
                data: err,
            }, res);
        });
};

exports.getUserScore = function (req, res) {
    const userId = req.query.userId || '';
    if (userId) {
        User
        .getUserScore(userId)
        .then((result) => {
            console.log(result);
            responseService.send({
                status: responseService.getCode().codes.OK,
                data: result,
            }, res);
        })
        .catch((err) => {
            responseService.send({
                status: responseService.getCode().codes.FAILURE,
                data: err,
            }, res);
        });
    } else {
        responseService.send({
                status: responseService.getCode().codes.FAILURE,
                data: "UserId not provided",
            }, res);
    }
};


