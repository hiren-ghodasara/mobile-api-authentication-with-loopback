'use strict';

var logger = require('../helpers/appLogger');
var async = require('async');

module.exports = function (Customer) {

    //save after login method 
    Customer.afterRemote('login', function (context, remoteMethodOutput, next) {
        if (remoteMethodOutput.userId) {
            var deviceId = context.args.credentials.deviceId || null;
            var deviceInfo = context.args.credentials.deviceInfo || null;
            //Customer.app.models.Token.destroyAll({});
            Customer.findById(remoteMethodOutput.userId, function (err, userRes) {
                if (err !== null) {
                    logger.error('Login after hook error', JSON.stringify(err));
                }
                if (userRes) {
                    userRes.lastLogin = new Date();
                    userRes.save();
                    var filter = { where: { deviceId: deviceId } };
                    var data = {
                        mobileNumber: userRes.mobileNumber,
                        userId: userRes.id,
                        deviceId: deviceId,
                        deviceInfo: deviceInfo
                    };
                    Customer.app.models.userDevice.findOrCreate(filter, data, function (e, instance, created) {
                        if (e !== null) {
                            logger.error('Login after hook  error', JSON.stringify(e));
                        }
                        if (instance) {
                            logger.debug('Login Save after hook is done', JSON.stringify(instance.userId));
                        }
                    })
                    //console.log('userRes', userRes);
                }
            });
        }
        next();
    });

    //validation
    //Customer.validatesLengthOf('password', { min: 15, message: { min: 'Password is too short' } });

    Customer.registration = function (userObj, options, req, cb) {
        console.log('userObj', userObj);
        var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        var oneTimePass = makeid();
        var deviceId = userObj.deviceId || false;
        delete userObj.deviceId;
        var deviceInfo = userObj.deviceInfo || false;
        delete userObj.deviceInfo;

        var filter = { where: { mobileNumber: userObj.mobileNumber } };
        Customer.findOne(filter, function (err, userRes) {
            if (err !== null) {
                cb(err);
            } else {
                if (!userRes) {
                    //registre new User
                    Object.assign(userObj, { otp: oneTimePass }, { ip: ip }, { username: userObj.mobileNumber });
                    //return cb(null, userObj);
                    async.waterfall([
                        function (callback) {
                            //console.log('First Step --> ');
                            makeReferralCode(function (code) {
                                Object.assign(userObj, { referralCode: code });
                                callback(null, userObj);
                            });
                        },
                        function (userObj, callback) {
                            //console.log('Second Step --> ', userObj);
                            if (userObj.invitationCode) {
                                var filter = { where: { referralCode: userObj.invitationCode } };
                                Customer.findOne(filter, function (err, referralUser) {
                                    if (err !== null) {
                                        callback(null, userObj);
                                    } else {
                                        if (referralUser) {
                                            var tempObj = {};
                                            if (referralUser.id) {
                                                tempObj.level1 = referralUser.id;
                                            }
                                            if (referralUser.level1) {
                                                tempObj.level2 = referralUser.level1;
                                            }
                                            if (referralUser.level2) {
                                                tempObj.level3 = referralUser.level2;
                                            }
                                            if (referralUser.level3) {
                                                tempObj.level4 = referralUser.level3;
                                            }
                                            if (referralUser.level4) {
                                                tempObj.level5 = referralUser.level4;
                                            }
                                            Object.assign(userObj, tempObj);
                                            callback(null, userObj);
                                        } else {
                                            callback(null, userObj);
                                        }
                                    }
                                });
                            } else {
                                callback(null, userObj);
                            }

                        },
                        function (userObj, callback) {
                            //console.log('Second three --> ', userObj);
                            Customer.create(userObj, function (err, cretedUserObj) {
                                if (err !== null) {
                                    callback(err);
                                }
                                callback(null, cretedUserObj);
                            });
                        },
                        function (userObj, callback) {
                            //console.log('Second four --> ', userObj);
                            //user.createAccessToken([ttl|data], [options], cb)
                            userObj.createAccessToken({
                                ttl: -1 // https://github.com/strongloop/loopback/pull/1797
                            }, function (err, obj) {
                                if (!(err !== null)) {
                                    Object.assign(userObj, { accessToken: obj.id });
                                }
                                callback(null, userObj);
                            });
                        }
                    ], function (err, finalUserObj) {
                        //console.log('finalUserObj', finalUserObj);
                        if (err !== null) {
                            logger.error('Customer registration error', JSON.stringify(err));
                            return cb(err);
                        }
                        //console.log('Main Callback --> ', finalUserObj);
                        if (deviceId && deviceInfo) {
                            finalUserObj.devices.create({
                                mobileNumber: finalUserObj.mobileNumber,
                                deviceId: deviceId,
                                deviceInfo: deviceInfo
                            }, function (err, devicesRes) {
                                if (err !== null) {
                                    logger.error('Customer devices create error', JSON.stringify(err));
                                }
                                console.log('devicesRes:', devicesRes);
                            });
                        }
                        finalUserObj.isSuccess = 1;

                        return cb(null, finalUserObj);
                    });
                }
                else {
                    logger.error('User Already register', JSON.stringify(err));
                    var res = {};
                    res.isSuccess = 0;
                    res.message = "User Already register";
                    return cb(null, res);
                }

            }

        });
    };

    function makeid() {
        var text = "";
        var possible = "0123456789";
        for (var i = 0; i < 4; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    function generateReferralCode(cb) {
        var text = "";
        var possible = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < 6; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return cb(text);
    }

    function makeReferralCode(callback) {
        function report() {
            generateReferralCode(function (code) {
                var filter = { where: { referralCode: code } };
                Customer.findOne(filter, function (err, userRes) {
                    if (err !== null) {
                        cb(err);
                        report();
                    } else {
                        if (!userRes) {
                            callback(code);
                        } else {
                            report();
                        }
                    }
                });
            });
        }
        report();
    }
};
