const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')

global.config = require('./config')
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
