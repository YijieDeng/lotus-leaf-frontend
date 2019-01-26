const router = require('koa-router')()

/**
 * Insert the solar panel information into a name tree (word trie tree).
 * The path is split by '/', the leaves are arrays that contains
 * the terminal destination.
 *
 * @param dict     current tree of names
 * @param name_arr the name and path information array (string split by '/')
 * @returns {*} a new object that contains updated data.
 */
function expand_trie(dict, name_arr) {
    if (name_arr.length === 0) return dict
    else if (name_arr.length === 1) {
        if (!dict.hasOwnProperty('places')) dict['places'] = []
        dict.places.push(name_arr[0])
    } else {
        const hd = name_arr[0]
        if (!dict.hasOwnProperty(hd)) dict[hd] = {}
        expand_trie(dict[hd], name_arr.slice(1))
        return dict;
    }
}

/**
 * Construct the optimized name presentation according to the name tree.
 *
 * @param dict         name tree
 * @param name_prefix  the prefix of the name of the solar panel
 * @returns {{}} An object mapping common prefix to list of name terminations.
 */
function construct_names(dict, name_prefix) {
    if (typeof dict === 'undefined' || dict === {} || Object.keys(dict).length === 0) {
        return {}
    } else {
        const keys = Object.keys(dict)
        let name_obj = {}
        if (keys.length === 1 && keys[0] === 'places') {
            name_obj[name_prefix] = [name_prefix]
            for (let i = 0; i < dict[keys[0]].length; ++i) {
                name_obj[name_prefix].push(dict[keys[0]][i])
            }
        } else {
            for (let i = 0; i < keys.length; ++i) {
                const key = keys[i]
                const next_level = construct_names(dict[key], name_prefix + '/' + key)
                Object.assign(name_obj, next_level)
            }
        }
        return name_obj
    }
}

router.get('/', async (ctx, next) => {
    const topic_snap = global.db.load_snap('topic_snap')
    const topic_names = await topic_snap.find_all()
    let dict_render = {}
    let name_tree = {}
    for (i = 0; i < topic_names.length; ++i) {
        const topic = topic_names[i]
        let topic_name = topic.topic_name
        let name_component = topic_name.split('/')
        name_tree = expand_trie(name_tree, name_component)
    }
    let names = []
    await Object.keys(name_tree).forEach((top_level_keys) => {
        let next_value = construct_names(name_tree[top_level_keys], top_level_keys)
        Object.assign(names, next_value)
    })
    dict_render['topics'] = names
    await ctx.render('index', dict_render)
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
    let params = ctx.request.body
    let topic = params.topic
    let date_start = params.time_start.date
    let time_start = params.time_start.time
    let date_end = params.time_end.date
    let time_end = params.time_end.time
    let sample_rate = params.sample_rate

    console.log(topic)

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
