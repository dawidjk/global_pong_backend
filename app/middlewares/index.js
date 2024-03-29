const Passport = require('./passport/');
const CommonMiddlewares = require('./common/');

class Middlewares {
    constructor(app) {
        this.app = app;
        this.initModules();
    }

    initModules() {
        /* eslint-disable no-unused-vars */
        const commonMiddlewares = new CommonMiddlewares(this.app);
        const passport = new Passport(this.app);
        /* eslint-enable no-unused-vars */
    }
}

module.exports = Middlewares;
