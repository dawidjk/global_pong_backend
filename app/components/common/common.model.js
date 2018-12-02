const db = require('../../db/');
const integrationServiceModel = require('../../models/integrationServiceModel');
const historicalListingModel = require('../../models/historicalListingModel');


exports.getVendors = function () {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT ${integrationServiceModel.id},
            ${integrationServiceModel.id},
            ${integrationServiceModel.name}
            FROM ${integrationServiceModel.collectionName}
             WHERE ${integrationServiceModel.isActive} = true`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows);
            }
        });
    }));
};

exports.getDistinctColumnList = function (vendor) {
    const dbModel = historicalListingModel[vendor];
    // TODO: Make this dynamic
    return Promise.all([
        this.distinctColumn(dbModel, dbModel.loanTerm),
        this.distinctColumn(dbModel, dbModel.loanGrade),
        this.distinctColumn(dbModel, dbModel.loanPurpose),
        this.distinctColumn(dbModel, dbModel.homeOwnership),
        this.distinctColumn(dbModel, dbModel.verificationStatus),
    ]).then(([loanTerm, loanGrade, loanPurpose, homeOwnership, verificationStatus]) => {
        const result = {};
        result.termList = loanTerm;
        result.gradeList = loanGrade;
        result.purposeList = loanPurpose;
        result.ownership = homeOwnership;
        result.verification = verificationStatus;
        return result;
    }).catch((err) => {
        // TODO: Improve error
        throw err;
    });
};

exports.distinctColumn = function (dbModel, columnName) {
    return new Promise(((resolve, reject) => {
        const queryString = `SELECT DISTINCT ${columnName} 
            FROM ${dbModel.collectionName}`;
        db.query(queryString, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res.rows);
            }
        });
    }));
};
