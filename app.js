const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
// const CSRF = require('koa-csrf')
const session = require('koa-generic-session')
const convert = require('koa-convert')
const serve = require('koa-static')
const mount = require('koa-mount')


// Global Vars
global.format_time = (ts) => {
    // convert UTC time to local time string
    let date = new Date(ts)
    let diff = date.getTimezoneOffset() * 60000
    return (new Date(date.getTime() - diff))
}
global.config = require('./.config')
global.sequelize = require('sequelize')
global.Op = global.sequelize.Op
global.db = {
    log(msg) {
        console.log(`[DB_LOG] ${msg}`)
    },
    instance : null,
    async connectDatabase() {
        const Sequlize = require('sequelize')
        this.instance = new Sequlize(global.config.db.name, global.config.db.username, global.config.db.password, {
            host : global.config.db.host,
            dialect : global.config.db.dialect,
            logging : global.config.mode === 'dev' ? this.log : null
        })
        require('./models/data')
        require('./models/meta')
        require('./models/topics')
        require('./models/volttron_table_definitions')
        global.Promise = Sequlize.Promise
        await this.instance.sync()
    },
    load_model(model_name) {
        return require(`./models/${model_name}`)
    },
    load_snap(snap_name) {
        return require(`./snaps/${snap_name}`)
    }
}

global.log = (msg) => {
    if (global.config.mode === 'dev')
        console.log(`[Manual Log] => ${msg}`)
}

console.log = config.mode === 'dev' ? console.log : (x) => {}

global.db.connectDatabase()

// Load Routers
const index = require('./routes/index')
const monitor = require('./routes/realtime')

// error handler
onerror(app)

// middlewares
app.use(json())
app.use(logger())
app.use(serve(__dirname + '/public')).use(mount(config.rootDir, serve(__dirname + '/public')))

app.keys = [config.secrete_key, config.session_key]
app.use(convert(session()));
app.use(bodyparser({
    enableTypes:['json', 'form', 'text']
}))

// Disable CSRF validation
/*
app.use(new CSRF({
    invalidStatusCode: 403,
    invalidTokenMessage: 'Invalid CSRF token',
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
    ignorePaths: [],
    secretLength: 16,
    saltRounds: 10
}))*/

app.use(views(__dirname + '/views', {
    extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(monitor.routes(), monitor.allowedMethods())

// error page
app.use(async (ctx, next) => {
    try {
        await next();
        if (ctx.status === 404) {
            ctx.throw(404);
        }
    } catch (err) {
        let dict_render = {location: "error"}
        console.error(err.stack);
        const status = err.status || 500;
        dict_render.error_code = err.status
        ctx.status = status;
        if (status === 404) {
            dict_render.title = "404 NOT FOUND"
            dict_render.message = 'Ahh...Nothing found here...';
        } else if (status === 500) {
            dict_render.title = "500 Internal Error"
            dict_render.message = 'Internal Error? No way!';
        } else if (status === 403) {
            dict_render.title = "403 Forbidden"
            dict_render.message = '[立入禁止] No Entry Here';
        }
        await ctx.render("error", dict_render);
    }
})

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});
app.listen(global.config.port)

module.exports = app
