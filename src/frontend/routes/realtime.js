const router = require('koa-router')()
const TopicSnap = global.db.load_snap('topic_snap')
const MetaSnap = global.db.load_snap('meta_snap')
const DataSnap = global.db.load_snap('data_snap')
const Utils = global.db.load_snap('common_snap')
const Op = (require('sequelize')).Op
const ejs = require('ejs')
const fs = require('fs')

router.prefix('/monitor')

router.get('/', async (ctx, next) => {
    let dict_render = {location: 'realtime'}
    dict_render.topics = await Utils.get_all_categorized_topics()
    dict_render.csrf = ctx.csrf
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
    const last_query = parseInt(params.last_query)
    if (typeof topics_list !== 'undefined') {
        const topic_id_map = await Utils.get_topic_id_map(topics_list)
        let dict_render = {}
        let where_arg = {}
        // If this is not a first query
        if (last_query !== null) {
            where_arg = {
                ts: {
                    [Op.gt]: new Date(last_query),
                    [Op.lte]: new Date(Date.now())
                }
            }
        } else {
            where_arg = {
                ts: {
                    [Op.gt]: new Date(Date.now() - 1000 * 10), // 10 seconds before
                    [Op.lte]: new Date(Date.now())
                }
            }
        }
        let ts = null
        let has_data = Object.keys(topic_id_map).length !== 0
        for (let i of Object.keys(topic_id_map)) {
            let data_arr = await DataSnap.get_data_by_tid(topic_id_map[i], where_arg)
            if (data_arr.length > 0) {
                dict_render[i] = parseFloat(data_arr[0].value_string)
                if (ts === null) {
                    // Get time stamp
                    ts = formatTime(new Date(data_arr[0].ts).toLocaleTimeString())
                }
            } else {
                dict_render[i] = null
            }
        }
        if (has_data)
            dict_render.time = ts
        else
            dict_render.time = new Date().toLocaleTimeString()
        ctx.body = dict_render
    } else {
        ctx.body = {time: formatTime(Date.now()).toLocaleTimeString()}
    }
})

module.exports = router