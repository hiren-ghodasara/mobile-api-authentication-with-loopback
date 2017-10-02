//============ Update All User level balance to 0 ==========
db.getCollection('Customer').updateMany({}, {
    $set: {
        levelBalance1: 0,
        levelBalance2: 0,
        levelBalance3: 0,
        levelBalance4: 0,
        levelBalance5: 0
    }
}, false, true);

//================