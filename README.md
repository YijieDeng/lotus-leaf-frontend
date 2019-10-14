# Web Panel for UW Solar Panels
This is a reconstruction project of UW Solar Data Project.

# Requirements
- MySQL
- NodeJS (v9.4.0 used for testing)

## Dependencies and Libraries
- Koa2
- EJS
- Chart.js
- Materialize CSS

## Installation
First install `node` and `mysql-*`.

Run `npm install` to install dependencies. Some of the
libraries are static files in the project.

Then copy `config-example.js` as `config.js` and modify
the configuration (Database, Port, etc). Set `dev` to `true` will
print logs to the terminal.

Finally run `npm start` or `node app.js`. If you encountered a database error, check whether you have started
daemon process or whether you have created the database you set in `config.js`.
