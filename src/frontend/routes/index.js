const router = require('koa-router')()

router.get('/', async (ctx, next) => {
    await ctx.render('index', {})
})

/**
 * Process data taken from a query. It will first validate the post data by
 * checking whether datetime start and datetime if a future time or datetime start
 * is after datetime end.
 * TODO: Discuss how to process data given by the backend and how to present data into
 *       the chart.
 */
router.post('/query', async (ctx, next) => {
    const CURRENT_TIME = new Date()
    var params = ctx.request.body
    var topic = params.topic
    var date_start = params.time_start.date
    var time_start = params.time_start.time
    var date_end= params.time_end.date
    var time_end = params.time_end.time
    var sample_rate = params.sample_rate

    const datetime_start = new Date(`${date_start} ${time_start}`)
    const datetime_end = new Date(`${date_end} ${time_end}`)

    if (datetime_end > CURRENT_TIME || datetime_start > CURRENT_TIME) {
        ctx.body = {
            status: 'error',
            message: 'Error: Time start / Time end is the future'
        }
    } else if (datetime_start > datetime_end) {
        ctx.body = {
            status: 'error',
            message: 'Error: Time end is before time start'
        }
    } else {
        ctx.body = {
            status: 'success', message: 'Success!'
        }
    }
})

module.exports = router
