const userController = require('./user.controller');

class UserRoute {
    constructor(app) {
        this.app = app;
        this.initRoutes();
    }
    initRoutes() {
        this.app.post(
            '/api/user/login',
            (req, res, next) => {
                userController.getAuthorization(req, res, next);
            },
        );
        this.app.post(
            '/api/user',
            (req, res, next) => {
                userController.registerUser(req, res, next);
            },
        );
        this.app.post(
            '/api/user/password',
            (req, res, next) => {
                userController.updatePassword(req, res, next);
            },
        );
        this.app.get(
            '/api/user',
            (req, res, next) => {
                userController.getUser(req, res, next);
            },
        );
        this.app.put(
            '/api/user',
            (req, res, next) => {
                userController.updateUser(req, res, next);
            },
        );
        this.app.post(
            '/api/forgot',
            (req, res, next) => {
                userController.forgotPassword(req, res, next);
            },
        );
        this.app.get(
            '/api/getCoastScore',
            (req, res, next) => {
                userController.getCoastScore(req, res, next);
            },
        );
        this.app.get(
            '/api/getUserScore',
            (req, res, next) => {
                userController.getUserScore(req, res, next);
            },
        );
        this.app.get(
            '/api/getCoordinates',
            (req, res, next) => {
                userController.getCoordinates(req, res, next);
            },
        );
    }
}

module.exports = UserRoute;
