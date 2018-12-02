const commonController = require('./common.controller');

class commonRoute {
    constructor(app) {
        this.app = app;
        this.initRoutes();
    }
    initRoutes() {
        this.app.get(
            '/api/common/vendor',
            (req, res) => {
                commonController.vendor(req, res);
            },
        );
        this.app.get(
            '/api/common/distinct-column',
            (req, res) => {
                commonController.getColumn(req, res);
            },
        );
        this.app.get(
            '/api/common/clean-cache',
            (req, res) => {
                commonController.cleanCache(req, res);
            },
        );
    }
}

module.exports = commonRoute;
