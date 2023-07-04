const Transport = require('winston-transport');

/**
 * @constructor
 * @param {Object} options - Options for the Oracle.
 * @param {String} options.table - Database table for the logs.
 * @param {String} options.pool   Oracle database pool object which is created from [oracledb@5.2.0]{@link https://www.npmjs.com/package/oracledb} package
 * @param {String} options.source  Source name, if your logs coming from different services.
 * @param {Object} **Optional** options.fields Log object, set custom fields for the log table
 */
module.exports = class OracleTransport extends Transport {
    constructor(options = {}) {
        super(options);

        this.name = 'Oracle';
        this.options = options || {};
        if (!options.pool) {
            throw new Error('The database pool connection object is required');
        }
        if (!options.table) {
            throw new Error('The database table name is required');
        }
        if (!options.source) {
            this.options.source = "default";
        }

        // check custom table fields - protect
        this.options.fields = {};
        //use default names
        this.fields = {
            level: 'log_level',
            message: 'message',
            source: 'source'
        }
        this.pool = options.pool

    }

    /**
     * function log (info, callback)
     * {level, msg} = info
     * @level {string} Level at which to log the message.
     * @msg {string} Message to log
     * @callback {function} Continuation to respond to when complete.
     * Core logging method exposed to Winston. Metadata is optional.
     */

    log(info, callback) {

        // get log content
        const { level, message } = info;

        process.nextTick(async () => {
            // protect
            if (!callback) {
                callback = () => { };
            }
            let connection = null;
            try {
                //set log object
                const log = {};
                log[this.fields.level] = level;
                log[this.fields.message] = Buffer.from(message + "").toString().substring(0, 4000);
                log[this.fields.source] = this.options.source;

                connection = await this.pool.getConnection();
                await connection.execute(`INSERT INTO ${this.options.table} (timestamp, log_level, message, source) values(sysdate, :log_level, substr(:message, 0, 4000), :source)`, log, { autoCommit: true });
                setImmediate(() => {
                    this.emit('logged', info);
                });
                return callback(null, true);
            } catch (error) {
                console.log(error);
                setImmediate(() => {
                    this.emit('error', error);
                });
                return callback(error, null);
            }
            finally {
                await connection.close();
                connection = null;
            }
        });
    }
};
