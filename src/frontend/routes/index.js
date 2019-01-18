const router = require('koa-router')()

router.get('/', async (ctx, next) => {
    await ctx.render('index', {})
})

router.post('/query', async (ctx, next) => {
    ctx.body = {
        status : 'success'
    }
})

module.exports = router
