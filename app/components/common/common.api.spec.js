const request = require('request');
const chai = require('chai');

const expect = chai.expect;
const config = require('../../../config/testing');
const testData = require('../../../config/testing/testData');

let token;

// TODO: Write more comprehensive testcases
describe('Should Check Integraton Account API ', () => {
    it('should login succesfully', (done) => {
        request.post({
            url: `${config.serverConfig.getUrl()}api/user/login`,
            form: {
                username: testData.username,
                password: testData.password,
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(result.data.application_user_id).to.equal('1');
            expect(resp.statusCode).to.equal(200);
            expect(result.code).to.equal(200);
            expect(result.data.token).to.exist;
            token = result.data.token;
            done();
        });
    });

    it('should get success for get /api/common/vendor and should get all active vendors', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/vendor`,
            headers: {
                'x-access-token': token,
            }
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

    it('should get success for get /api/common/vendor and should get all distinct columns for Prosper', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/distinct-column`,
            headers: {
                'x-access-token': token,
            },
            qs: {
                vendor: 'Prosper',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

    it('should get success for get /api/common/vendor and should get all distinct columns for Prosper', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/distinct-column`,
            headers: {
                'x-access-token': token,
            },
            qs: {
                vendor: 'LendingClub',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

    it('should get success for get /api/common/vendor and should get all distinct columns for Upstart', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/distinct-column`,
            headers: {
                'x-access-token': token,
            },
            qs: {
                vendor: 'Upstart',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

    it('should get success for get /api/common/vendor and should get all distinct columns for FundingSocietiesSGD', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/distinct-column`,
            headers: {
                'x-access-token': token,
            },
            qs: {
                vendor: 'FundingSocietiesSGD',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

    it('should get success for get /api/common/vendor and should get all distinct columns for FundingSocietiesIDR', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/distinct-column`,
            headers: {
                'x-access-token': token,
            },
            qs: {
                vendor: 'FundingSocietiesIDR',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

    it('should get success for get /api/common/cache and should clear cache for loggedin user', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/common/clear-cache`,
            headers: {
                'x-access-token': token,
            }
        }, (err, resp, body) => {
            expect(resp.statusCode).to.equal(200);
            done();
        });
    });

});
