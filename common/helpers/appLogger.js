
var winston = require('winston');
require('winston-daily-rotate-file');
var transport = new (winston.transports.DailyRotateFile)({
    filename: './public/logs/.log',
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error',
});

var logger = new (winston.Logger)({
    transports: [
        transport
    ]
});

module.exports = logger;
