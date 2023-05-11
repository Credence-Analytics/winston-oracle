# winston-oracle
Oracle transport plugin for winston@3.x logger

Introduction
------------
This Oracle transport module is a plugin for winston@3.x logger running in node.js.

Current version plugin supports Winston@3.x.

## Install

```bash
$ npm install winston-oracle
```

## Prerequisites
`winston-oracle` is dependent on below mentioned libraries:
- oracledb >= 5.x ([*Download Link*](https://www.npmjs.com/package/oracledb)).
- winston >= 3.x ([*Download Link*](https://www.npmjs.com/package/winston)).

## Use

```js

import OracleTransport from 'winston-oracle';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'debug', // Winston level
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.json(),
        }),
        // pool, table and source are mandatory.
        // oracleDBPool object should be created from from [oracledb@5.2.0](https://www.npmjs.com/package/oracledb) pacakge and from oracledb.createPool() method.
        new OracleTransport({ pool: oracleDBPool, table: "SYS_LOGS", source: "default" }),
    ],
});


const msg = `Logger added with winston`;

logger.debug(msg);
logger.error(msg);
logger.info(msg);
logger.warn(msg);

```

Installation
------------
You should create a table in the database first.

Demos:
```SQL
CREATE TABLE `WinstonDB`.SYS_LOGS (
  log_level VARCHAR2(50),
  message VARCHAR2(4000),
  source VARCHAR2(100),
  timestamp DATE
); 
```
