'use strict';


module.exports = function (app) {

    var User = app.models.Customer;
    var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;

    User.find({ limit: 1 }, function (err, users) {

        if (err == null && users && users.length == 0) {
            createDefaultAdminUserRole();
        }
    });

    function createDefaultAdminUserRole() {
        generateReferralCode(function (code) {
            User.create([
                {
                    username: '9723227593',
                    email: 'hirenpatel56377@gmail.com',
                    password: 'demo@123',
                    name: 'Hiren Ghodasara',
                    mobileNumber: '9723227593',
                },
                {
                    username: '9722576333',
                    email: 'hiren.ghodasara@outlook.com',
                    password: 'demo@123',
                    name: 'Hiren Patel',
                    mobileNumber: '9722576333',
                    referralCode: code,
                },
            ], function (err, users) {
                if (err) throw err;
                console.log("Created User: ", users);
                //create the admin role
                Role.findOne({ where: { name: "administrator" }, limit: 1 }, function (err, roleObj) {
                    if (err !== null) {
                        return;
                    }
                    if (roleObj) {
                        roleObj.principals.create({
                            principalType: RoleMapping.USER,
                            principalId: users[0].id
                        }, function (err, principal) {
                            console.log('Admin Role Create Principal:', principal);
                            // now it should be fine :)
                        });
                    } else {
                        Role.create({
                            name: 'administrator'
                        }, function (err, role) {
                            if (err) throw err;
                            //make bob an admin
                            role.principals.create({
                                principalType: RoleMapping.USER,
                                principalId: users[0].id
                            }, function (err, principal) {
                                console.log('Created principal:', principal);
                            });
                        });
                    }
                });
            });
        });

    }
    function generateReferralCode(cb) {
        var text = "";
        var possible = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < 6; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return cb(text);
    }
};

