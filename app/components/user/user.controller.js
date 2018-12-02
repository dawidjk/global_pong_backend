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

const from_email = 'fom@email.com';

const smtpTransport = nodemailer.createTransport({
    secureConnection: false,
    port: '587',
    host: 'smtp.zoho.com',
    auth: {
        user: from_email,
        pass: 'Password',
    },
    tls: { ciphers: 'SSLv3' },
});

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
                responseService.send({
                    status: responseService.getCode().codes.OK,
                    data: result
                }, res);
            })
            .catch((err) => {
                logger.log('error', `${username} loggedin unsuccesful, wrong username/password`);
                responseService.send({
                    status: responseService.getCode().codes.UNAUTHORIZED,
                    data: 'Wrong username and password',
                }, res);
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
    const firstName = req.body.firstName || '';
    const lastName = req.body.lastName || '';
    const email = req.body.email || '';
    const password = req.body.password || '';
    if (firstName && lastName && email && password) {
        const user = {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            user_email: email,
            user_password: '',
            provider: 'local',
            salt: _generateSalt(),
            is_active: false,
            agreed_tos: true,
            profile_image_url: './userImages/default.png',
            created_at: moment().tz('America/New_York').format('YYYY-M-DTHH:mm:ss.sssZ'),
        };
        user.user_password = _encryptPassword(password, user.salt);
        User
            .registerUser(user)
            .then((result) => {
                User.addShadow(result.application_user_id, 'I', moment().format('YYYY-M-DTHH:mm:ss.sssZ'), 'New User', '', JSON.stringify(result))
                    .then((shadow) => {
                        logger.log('info', `${email} registered successfully`);
                        responseService.send({
                            status: responseService.getCode().codes.OK,
                            data: 'Thank you for creating an account. Please email our support staff to verify your account.',
                        }, res);
                    })
                    .catch((err) => {
                        logger.log('error', ` Error while registering ${email}, the error is ${err}`);
                        responseService.send({
                            status: responseService.getCode().codes.FAILURE,
                            data: err,
                        }, res);
                    });
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

exports.updateUser = function (req, res) {
    const userId = req.body.userId || '';
    const firstName = req.body.firstName || '';
    const lastName = req.body.lastName || '';
    const email = req.body.email || '';
    const updates = {
        first_name: firstName,
        last_name: lastName,
        user_email: email,
    };
    const updatedAt = moment().tz('America/New_York').format('YYYY-M-DTHH:mm:ss.sssZ');
    if (userId) {
        User
            .getUser(userId)
            .then((result) => {
                if (!updates.first_name) updates.first_name = result.first_name;
                if (!updates.last_name) updates.last_name = result.last_name;
                if (!updates.user_email) updates.user_email = result.user_email;
                updates.display_name = `${updates.first_name} ${updates.last_name}`;
                Promise.all([
                    User.updateUser(userId, updates, updatedAt),
                    User.addShadow(userId, 'U', moment().format('YYYY-M-DTHH:mm:ss.sssZ'), 'User Info', JSON.stringify(result), JSON.stringify(updates)),
                ]).then(values => responseService.send({
                    status: responseService.getCode().codes.OK,
                    data: values,
                }, res)).catch((reason) => {
                    logger.log('error', ` ${userId} is not updated - reason - ${reason}`);
                    responseService.send({
                        status: responseService.getCode().codes.FAILURE,
                        data: reason,
                    }, res);
                });
            })
            .catch((err) => {
                logger.log('error', ` ${userId} not found`);
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

exports.updatePassword = function (req, res) {
    const userId = req.body.userId || '';
    const oldPassword = req.body.oldPassword || '';
    const newPassword = req.body.newPassword || '';
    const confirmPassword = req.body.confirmPassword || '';
    const updatedAt = moment().tz('America/New_York').format('YYYY-M-DTHH:mm:ss.sssZ');
    console.log(userId);
    if (userId) {
        User
            .getUser(userId)
            .then((result) => {
                if(newPassword != confirmPassword){
                  console.log("new passwords don't match");
                  return responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                        data: 'New password and confirm password were different!',
                    }, res);
                }
                if(result.user_password == _encryptPassword(oldPassword, result.salt)){
                  updatedSalt = _generateSalt();
                  updatedPassword = _encryptPassword(newPassword, updatedSalt);
                  Promise.all([
                      User.updatePassword(userId, updatedPassword, updatedSalt, updatedAt),
                      User.addShadow(userId, 'U', moment().format('YYYY-M-DTHH:mm:ss.sssZ'), 'User Info', JSON.stringify(result), 'Password Change'),
                  ]).then(values => responseService.send({
                      status: responseService.getCode().codes.OK,
                      data: values,
                  }, res)).catch((reason) => {
                      logger.log('error', ` ${userId} is not updated - reason - ${reason}`);
                      responseService.send({
                          status: responseService.getCode().codes.FAILURE,
                          data: reason,
                      }, res);
                  });
                } else {
                  console.log("old password doesn't match");
                  return responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                        data: 'Old password does not match',
                    }, res);
                }
            })
            .catch((err) => {
                logger.log('error', ` ${userId} not found`);
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

exports.forgotPassword = function (req, res, next) {
    const email = req.body.email || '';
    const createdAt = moment().tz('America/New_York').format('YYYY-M-DTHH:mm:ss.sssZ');
    async.waterfall([
    // Generate random token
        function (done) {
            crypto.randomBytes(20, (err, buffer) => {
                const token = buffer.toString('hex');
                done(err, token);
            });
        },
        // Lookup user by email
        function (token, done) {
            if (email) {
                User.getUserByEmail(email)
                    .then((user) => {
                        if (!user) {
                            return responseService.send({
                                status: responseService.getCode().codes.FAILURE,
                                data: 'This email is not registered.',
                            }, res);
                        } /* else if (user.provider !== 'local') {
                return responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                    data: 'It seems that you signed up with your ' + user.provider + 'account.',
                }, res);
              } */
                        // Create Reset Token
                        User.addResetToken({ token, applicationUserId: user.application_user_id, createdAt }).then((reset) => {
                            if (!reset) {
                                return responseService.send({
                                    status: responseService.getCode().codes.FAILURE,
                                    data: 'Something went wrong on our end! Sorry about that.',
                                }, res);
                            }
                            done(undefined, token, user);
                        }).catch((err) => {
                            done(err, token, user);
                        });
                    });
            } else {
                return responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                    data: 'Email cannot be blank',
                }, res);
            }
        },
        function (token, user, done) {
            const url = `${req.headers.origin}/reset/${token}`;
            const emailHTML = `<!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <title></title>
        </head>

        <body>
          <p>Dear ${user.display_name},</p>
          <br />
          <p>
            You have requested to have your password reset for your account at Backend
          </p>
          <p>Please visit this url to reset your password:</p>
          <p>${url}</p>
          <strong>If you didn't make this request, you can safely ignore this email.</strong>
          <br />
          <br />
          <p>The Backend Support Team</p>
        </body>

        </html>`;
            done(null, emailHTML, user);
        },
        // If valid email, send reset email using service
        function (emailHTML, user, done) {
            const mailOptions = {
                to: user.user_email,
                from: from_email,
                subject: 'Password Reset',
                html: emailHTML,
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                if (!err) {
                    responseService.send({
                        status: responseService.getCode().codes.OK,
                        data: 'An email has been sent with further instructions.',
                    }, res);
                } else {
                    logger.log('error', ` Error in sending email - ${err}`);
                    return responseService.send({
                        status: responseService.getCode().codes.FAILURE,
                        data: 'Sorry about that, we\'re having trouble sending you the reset email.',
                    }, res);
                }

                done(err);
            });
        },
    ], (err) => {
        logger.log('error', ` Error in sending email - ${err}`);
        if (err) {
            return next(err);
        }
    });
};
