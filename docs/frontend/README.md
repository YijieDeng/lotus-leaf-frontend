# Web Panel for UW Solar Panels
This is a reconstruction project of UW Solar Data Project.

## Requirements
- MySQL
- NodeJS (v9.4.0 used for testing)

## Dependencies and Libraries
- Koa2
- EJS
- Chart.js
- Materialize CSS

## Installation
Run `config-env.sh` to install requirements
```
sudo ./config-env.sh
```

Run `npm install` to install dependencies. Some of the
libraries are static files in the project.

Then copy `config-example.js` as `config.js` and modify
the configuration (Database, Port, etc). Turn `dev` to `true` will
print logs to the terminal.

Finally run `npm start` or `node app.js`. If you encountered a database error, check whether you have started
daemon process or whether you have created the database you set in `config.js`.

## Run with PM2
If the configuration script finished correctly, `PM2` will be installed by default. You can run `pm2 start app.js` to load the application to pm2 and run it in background.

To see more usage of pm2, go to [PM2 Official Website](http://pm2.keymetrics.io)