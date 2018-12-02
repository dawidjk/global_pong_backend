/* eslint-disable consistent-return,max-len,camelcase */
const commonModel = require('./common.model');
const responseService = require('../../utils/ResponseService');
const cache = require('../../utils/LRUCaching');
const _ = require('lodash');

// Support Functions
function deleteMatchingCache(cacheObj, initialCacheString) {
    return new Promise(((resolve, reject) => {
        const allKeys = cacheObj.keys();
        const total = allKeys.length;
        for (let index = 0; index < total; index++) {
            const keyName = allKeys[index];
            if (_.includes(keyName, initialCacheString)) {
                cacheObj.del(keyName);
            }
        }
        resolve();
    }));
}

// Support Functions

/**
 * Return specific account or all account belonging to user depending on parameters
 * Can be pre-cached
 */
exports.vendor = function (req, res) {
    const cacheKey = 'vendorList';
    if (cache.has(cacheKey)) {
        responseService.send({
            status: responseService.getCode().codes.OK,
            data: cache.get(cacheKey),
        }, res);
    } else {
        commonModel
            .getVendors()
            .then((result) => {
                cache.set(cacheKey, result);
                responseService.send({
                    status: responseService.getCode().codes.OK,
                    data: result,
                }, res);
            })
            .catch(err => responseService.send({
                status: responseService.getCode().codes.FAILURE,
                data: err,
            }, res));
    }
};

// TODO: Improve this
exports.getColumn = function (req, res) {
    // can be pre-cached
    let vendor = req.query.vendor ? req.query.vendor : '';
    if (vendor) {
        vendor = `listingHistory${vendor}`;

        // Add caching
        if (cache.has(vendor)) {
            responseService.send({
                status: responseService.getCode().codes.OK,
                data: cache.get(vendor),
            }, res);
        } else {
            commonModel
                .getDistinctColumnList(vendor)
                .then((result) => {
                    // cache the results
                    cache.set(vendor, result);
                    responseService.send({
                        status: responseService.getCode().codes.OK,
                        data: result,
                    }, res);
                })
                .catch(err => responseService.send({
                    status: responseService.getCode().codes.FAILURE,
                    data: err,
                }, res));
        }
    } else {
        responseService.send({
            status: responseService.getCode().codes.BAD_REQUEST,
            data: 'Please provide vendor and column name',
        }, res);
    }
};


// TODO: Improve this
exports.cleanCache = function (req, res) {
    // can be pre-cached
    const applicationUserId = req.body.application_user_id;
    const cacheKeyInitial = `userCache_applicationUserId_${applicationUserId}`;

    // blocking code, converted into promise for async operation
    deleteMatchingCache(cache, cacheKeyInitial)
        .then((result) => {
            responseService.send({
                status: responseService.getCode().codes.OK,
                data: result,
            }, res);
        })
        .catch((error) => {
            responseService.send({
                status: responseService.getCode().codes.FAILURE,
                data: 'Something went wrong',
            }, res);
        });
};

