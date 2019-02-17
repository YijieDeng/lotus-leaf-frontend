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
    await ctx.render('monitor', dict_render)
})

router.post('/fetch', async (ctx, next) => {
    const params = ctx.request.body
    const topics_list = params.topics
    if (typeof topics_list !== 'undefined') {
        const topic_id_map = await Utils.get_topic_id_map(topics_list)
        // Since the collectors are not implemented yet, this currently will only return fake data.
        let dict_render = {}
        for (let i of Object.keys(topic_id_map)) {
            dict_render[i] = Math.random() * 114.5141919810
        }
        dict_render.time = formatTime(Date.now()).toLocaleTimeString()
        console.log(dict_render)
        ctx.body = dict_render
    } else {
        ctx.body = {time: formatTime(Date.now()).toLocaleTimeString()}
    }
})

module.exports = router