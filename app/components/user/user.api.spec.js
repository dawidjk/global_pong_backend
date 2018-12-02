const request = require('request');
const chai = require('chai');

const expect = chai.expect;

const config = require('../../../config/testing');
const testData = require('../../../config/testing/testData');

let token;

// TODO: Get test data from separate files

describe('Should Get User', () => {
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

    it('should get user information ', (done) => {
        request.get({
            url: `${config.serverConfig.getUrl()}api/user`,
            headers: {
                'x-access-token': token,
            },
            qs: {
                userId: '1',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(result.data.application_user_id).to.equal('1');
            expect(result.data.first_name).to.equal('Dave');
            expect(result.data.last_name).to.equal('Kluszczynski');
            expect(result.data.display_name).to.equal('Dave Kluszczynski');
            expect(result.data.user_email).to.equal('david@digital_mosaic_capital.com');
            expect(result.data.is_active).to.equal(true);
            expect(result.data.agreed_tos).to.equal(true);
            expect(result.data.created_at).to.equal('2017-10-31T21:43:49.850Z');
            expect(resp.statusCode).to.equal(200);
            expect(result.code).to.equal(200);
            done();
        });
    }); 
    
    it('should update user information ', (done) => {
        request.put({
            url: `${config.serverConfig.getUrl()}api/user`,
            headers: {
                'x-access-token': token,
            },
            form: {
                userId: '1',
                firstName: 'TEST RENAME Dave',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            expect(result.code).to.equal(200);
            expect(result.data[1].Message).to.equal('Successfully added shadow');
            request.put({
                url: `${config.serverConfig.getUrl()}api/user`,
                headers: {
                    'x-access-token': token,
                },
                form: {
                    userId: '1',
                    firstName: 'Dave',
                },
            }, (err, resp, body) => {
                const result = JSON.parse(body);
                expect(resp.statusCode).to.equal(200);
                expect(result.code).to.equal(200);
                expect(result.data[1].Message).to.equal('Successfully added shadow');
                done();
            });
        });        
    });  
    
    //DISABLE BUT TESTED MANUALLY ONCE
    /*it('should create user information ', (done) => {
        request.post({
            url: `${config.serverConfig.getUrl()}api/user`,
            headers: {
                'x-access-token': token,
            },
            form: {
                firstName: 'test first name',
                lastName: 'test last name',
                email: 'test@digital_mosaic_capital.com',
                password:'password123',
            },
        }, (err, resp, body) => {
            const result = JSON.parse(body);
            expect(resp.statusCode).to.equal(200);
            expect(result.code).to.equal(200);
            done();
        });
    }); */
});
