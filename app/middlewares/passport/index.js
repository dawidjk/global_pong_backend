const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const config = require('../../../config/');
const responseService = require('../../utils/ResponseService');


const whiteListUrls = new Map();
whiteListUrls.set('/api/user/login', true);
whiteListUrls.set('/api/user/loginFail', true);
whiteListUrls.set('/api/user', true);
whiteListUrls.set('/isServerUp', true);
whiteListUrls.set('/api/forgot', true);


// TODO:
class Passport {
    constructor(app) {
        this.app = app;
        this.initialize();
        this.addStragegies();
        this.addSerialization();
    }

    initialize() {
        this.app.use(passport.initialize());
    }

    addStragegies() {
        this.addLocalStrategy();
    }

    addLocalStrategy() {
        passport.use(new LocalStrategy(((username, password, done) => {})));
    }
    addSerialization() {
        this.app.use((req, res, next) => {
            // check header or url parameters or post parameters for token
            try {
                if (req.url) {
                    const url = req.url.toString();
                    if (!whiteListUrls.has(url)) {
                        const token = req.headers['x-access-token'] || '';
                        // decode token
                        if (token) {
                            // verifies secret and checks exp
                            jwt.verify(
                                token,
                                config.serverConfig.getPassportJWTSecretKey(),
                                (err, decoded) => {
                                    if (err) {
                                        return responseService.send({
                                            status: responseService.getCode().codes.FORBIDDEN,
                                            data: 'Token is invalid',
                                        }, res);
                                    }
                                    // if everything is good,
                                    // save to request for use in other routes
                                    if (req.body) {
                                        req.body.application_user_id = decoded.application_user_id;
                                    } else {
                                        req.body = {};
                                        req.body.application_user_id = decoded.application_user_id;
                                    }
                                    next();
                                },
                            );
                        } else {
                            // if there is no token
                            // return an error
                            return responseService.send({
                                status: responseService.getCode().codes.BAD_REQUEST,
                                data: 'Token is required with headers',
                            }, res);
                        }
                    } else {
                        next();
                    }
                }
            } catch (e) {
                return responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                    data: 'Internal Server Problem',
                }, res);
            }
        });
    }
}
module.exports = Passport;
