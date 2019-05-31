const router = require('koa-router')()
const TopicSnap = global.db.load_snap('topic_snap')
const MetaSnap = global.db.load_snap('meta_snap')
const DataSnap = global.db.load_snap('data_snap')
const Utils = global.db.load_snap('common_snap')
const Op = (require('sequelize')).Op
const ejs = require('ejs')
const fs = require('fs')

router.prefix(config.rootDir + 'monitor')

router.get('/', async (ctx, next) => {
    let dict_render = {location: 'realtime'}
    dict_render.topics = await Utils.get_all_categorized_topics()
    // dict_render.csrf = ctx.csrf
    await ctx.render('monitor', dict_render)
})

/**
 * Get the data of panels from the collectors
 * Note: because the collector might not instantly get the response from
 * the panel, the time period of collectors putting the data into the database
 * is not stable. So we need to query for a shortest time interval such that it guarantees
 * there is at least one data point of each panels.
 */
router.post('/fetch', async (ctx, next) => {
    const params = ctx.request.body
    const topics_list = params.topics
    let last_query = null;
    if (params.last_query) {
        last_query = parseInt(params.last_query)
    }
    if (typeof topics_list !== 'undefined') {
        const topic_id_map = await Utils.get_topic_id_map(topics_list)
        let dict_render = {}
        // dict_render.csrf = ctx.csrf
        let where_arg = {}
        // If this is not a first query
        if (last_query !== null) {
            where_arg = {
                ts: {
                    [Op.gt]: new Date(last_query - 1000 * 2),
                    [Op.lte]: new Date(Date.now()),
                },
            }
        } else {
            where_arg = {
                ts: {
                    [Op.gt]: new Date(Date.now() - 1000 * 10), // 10 seconds before
                    [Op.lte]: new Date(Date.now()),
                }
            }
        }
        const process_time = (ts) => {
            // convert UTC time to local time string
            let date = new Date(ts)
            let diff = date.getTimezoneOffset() * 60000
            return (new Date(date.getTime() - diff)).toLocaleTimeString()
        }
        let ts = null
        let has_data = Object.keys(topic_id_map).length !== 0
        for (let i of Object.keys(topic_id_map)) {
            let data_arr = await DataSnap.get_data_by_tid(topic_id_map[i], where_arg, [['ts', 'DESC']])
            if (data_arr.length > 0) {
                dict_render[i] = parseFloat(data_arr[0].value_string)
                if (ts === null) {
                    // Get time stamp
                    ts = data_arr[0].ts.toLocaleString()
                    ts = process_time(ts)
                }
            } else {
                dict_render[i] = null
            }
        }
        if (has_data && ts !== null)
            dict_render.time = ts
        else
            dict_render.time = new Date().toLocaleTimeString()
        ctx.body = dict_render
    } else {
        ctx.body = {time: new Date(Date.now()).toLocaleTimeString()}
    }
})

module.exports = router
