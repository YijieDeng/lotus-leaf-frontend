const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')

global.config = require('./.config')
global.sequelize = require('sequelize')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

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

// error page
app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) {
      ctx.throw(404);
    }
  } catch (err) {
    let dict_render = {}
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
  }
}

global.db.connectDatabase()
app.listen(global.config.port)

module.exports = app
