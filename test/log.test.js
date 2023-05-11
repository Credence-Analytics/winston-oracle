const winston = require('winston');
const oracledb = require('oracledb');
const expect = require('chai').expect;
const OracleTransport = require('../index');


function sleep(){
    return new Promise(function(resolve,reject){
        setTimeout(resolve, (1000));
    })
}

//test config for database, you can change it with your configuration.
/**
 * To run the test case you will require [winston@3.1.0]{@link https://www.npmjs.com/package/winston} package and [oracledb@5.2.0]{@link https://www.npmjs.com/package/oracledb} package
 */

describe('Test oracle transport for winston', async function () {
    it('always pass', async function () {
        let connpool = null, connection = null, connectObj = {
            "user": "ORATEST", // Database username
            "password": "ORATEST", // Database password
            "connectString": "ORATEST:1521/ORATEST" // Database HOST:PORT/SID
        }
        try {
            const connpool = await oracledb.createPool({
                "user": connectObj.user,
                "password": connectObj.password,
                "connectString": connectObj.connectString
            });
            const logger = winston.createLogger({
                level: 'debug',
                format: winston.format.json(),
                transports: [
                    new winston.transports.Console({
                        format: winston.format.simple(),
                    }),
                    new OracleTransport({ pool: connpool, table: "SYS_LOGS", source: "appbuilder" })
                ],
            });
            const rnd = Math.floor(Math.random() * 1000);
            const msg = `Test message: ${rnd}`;

            logger.debug(msg);
            logger.error(msg);
            logger.info(msg);
            logger.warn(msg);
            await sleep();
            try {
                connection = await connpool.getConnection();
                const cnt = await connection.execute(`SELECT * FROM SYS_LOGS WHERE LOWER(message) = lower('${msg}')`);
                await expect(cnt.rows.length).to.equal(4);
            } catch (error) {
                console.log(error);
            }
        } catch (err) {
            console.log(err.message);
        } finally {
            if (connection) {
                await connection.close();
                connection = null;
            }
            if (connpool) {
                await connpool.close(10);
                connpool = null;
            }
        }

    });
});
