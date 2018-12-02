const User = require('./user/');
const Common = require('./common/');


class Components {
    constructor(app) {
        this.app = app;
        this.initModules();
    }

    initModules() {
        // TODO: Fetch components dynamically without creating objects
        // or use Awilix - ref - https://github.com/jeffijoe/awilix
        /* eslint-disable no-unused-vars */
        const userObj = new User(this.app);
        const commonObj = new Common(this.app);
        /* eslint-enable no-unused-vars */
    }
}

module.exports = Components;
