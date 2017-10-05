'use strict';
var logger = require('../helpers/appLogger');
var app = require('../../server/server.js');

module.exports = function (Transactionhistory) {

    Transactionhistory.updateBalance = function (amount, type, options, cb) {
        var CustomerModel = Transactionhistory.app.models.Customer;
        var userId = options.accessToken.userId;
        CustomerModel.findById(userId, function (err, userRes) {
            if (err !== null) {
                logger.error('updateBalance Find User error', JSON.stringify(err));
                cb(err);
            } else {
                if (userRes) {
                    Transactionhistory.create({
                        userId: userId,
                        amount: amount,
                        type: type,
                    }, function (e, history) {
                        if (e !== null) {
                            logger.error('Transactionhistory create error', JSON.stringify(err));
                            cb(e);
                        }
                        userRes.balance += amount;
                        userRes.save();
                        for (var i = 1; i <= 5; i++) {
                            var levelUserId = 'level' + i;
                            //console.log('userRes.levelUserId', userRes[levelUserId]);
                            updateReffrealUserBlance(userRes[levelUserId], i, amount);
                        }
                        cb(null, userRes);
                    });
                } else {
                    var er = new Error();
                    er.status = 400;
                    er.message = "User Not Found";
                    cb(er);
                }
            }
        });
    }

    function updateReffrealUserBlance(userId, level, amount) {
        var CustomerModel = Transactionhistory.app.models.Customer;
        CustomerModel.findById(userId, function (err, userRes) {
            if (err !== null) {
                logger.error('updateReffrealUserBlance error', JSON.stringify(err));
            } else {
                if (userRes) {
                    if (level == 1) {
                        userRes.levelBalance1 += parseFloat(getPercentageAmount(amount, app.get('level1Percentage')));
                    } else if (level == 2) {
                        userRes.levelBalance2 += parseFloat(getPercentageAmount(amount, app.get('level2Percentage')));
                    } else if (level == 3) {
                        userRes.levelBalance3 += parseFloat(getPercentageAmount(amount, app.get('level3Percentage')));
                    } else if (level == 4) {
                        userRes.levelBalance4 += parseFloat(getPercentageAmount(amount, app.get('level4Percentage')));
                    } else if (level == 5) {
                        userRes.levelBalance5 += parseFloat(getPercentageAmount(amount, app.get('level5Percentage')));
                    }
                    //console.log('userRes', userRes);
                    userRes.save();
                }
            }
        });
    }

    function getPercentageAmount(amount, percentage) {
        var amount = parseFloat(parseFloat(percentage * amount) / 100).toFixed(2);
        //console.log(amount, percentage);
        return amount;
    }
};
