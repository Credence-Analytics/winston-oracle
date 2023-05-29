const winston = require('winston');
const oracledb = require('oracledb');
const expect = require('chai').expect;
const OracleTransport = require('../index');
let WINSTON_ORACLE_CONFIG = {};
try {
    WINSTON_ORACLE_CONFIG = require('../config.json');
} catch (error) {
    throw new Error(`Config file required to run test! Create config file using \`config.json.example\``);
}

const { user, password, host, port, sid } = WINSTON_ORACLE_CONFIG;
const test_log_level = 'info'

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};

function sleep() {
    return new Promise(function (resolve, _reject) {
        setTimeout(resolve, (1000));
    })
}

let dbpool = null, connection = null;
before('Creating connection', async function () {
    // Creating standalone db connection and db pool
    ([dbpool, connection] = await Promise.all([
        oracledb.createPool({ "user": user, "password": password, "connectString": `${host}:${port}/${sid}` }),
        oracledb.getConnection({ "user": user, "password": password, "connectString": `${host}:${port}/${sid}` })
    ]));
})

after('Closing connection', async function () {
    // Closing standalone db connection and db pool
    const dbclose = [connection, dbpool].map(function (db_obj) {
        if (db_obj)
            return db_obj.close();
        return Promise.resolve();
    });
    await Promise.all(dbclose);
    dbpool = null, connection = null;
})


//test config for database, you can change it with your configuration.
/**
 * To run the test case you will require [winston@3.1.0]{@link https://www.npmjs.com/package/winston} package and [oracledb@5.2.0]{@link https://www.npmjs.com/package/oracledb} package
 */
describe('Test oracle transport for winston', async function () {
    it('always pass', async function () {
        function logMsg(logger) {
            return function (msg) {
                Object.keys(levels).forEach(function (level) {
                    logger[level](msg)
                });
            }
        }
        let testLogger = null;
        try {
            // Init logger
            const logger = winston.createLogger({
                level: test_log_level,
                format: winston.format.json(),
                transports: [
                    new winston.transports.Console({ format: winston.format.simple(), }),
                    new OracleTransport({ pool: dbpool, table: "SYS_LOGS", source: "winston-oracle-testing" })
                ]
            });

            // Deleting existing records
            await connection.execute(`DELETE FROM SYS_LOGS WHERE source = :1`, ["winston-oracle-testing"]);
            testLogger = logMsg(logger);
            const testScript = [
                testLogger(`Test message`),  // String 
                testLogger(function ab() { throw new Error('Log Error') }), // Function
                testLogger(1), // Number
                testLogger(0.110029999999999), // Float
                testLogger(0, 0), // Extra arguments
                testLogger(["ab", "abc"]), // Array
                testLogger(["ab", 12345, 0.1333333333, { "test_object": "test_value" }, ["array_of_array"], null]), // Array with different data type
                testLogger(null), // NULL
                testLogger(undefined), // Undefined
                testLogger(''), // Empty
                testLogger({ "test": "abc" }) // Object
            ]
            await sleep();
            const cnt = await connection.execute(`SELECT 1 FROM SYS_LOGS WHERE source = :1`, ["winston-oracle-testing"]);
            expect(cnt.rows.length).to.equal((levels[test_log_level] * testScript.length) + testScript.length);
        } catch (err) {
            throw new Error(err);
        }
    });
});
