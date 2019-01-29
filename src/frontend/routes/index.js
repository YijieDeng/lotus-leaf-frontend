const router = require('koa-router')()
const TopicSnap = global.db.load_snap('topic_snap')
const MetaSnap = global.db.load_snap('meta_snap')
const DataSnap = global.db.load_snap('data_snap')
const Op = (require('sequelize')).Op

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

/**
 * Generate random color written in a String
 *
 * @returns {string} the random color represented by call of rgba function
 */
function random_color(alpha=1.0) {
    let rand_num = () => {
        return Math.floor(Math.random() * 256)
    }
    return `rgba(${rand_num()}, ${rand_num()}, ${rand_num()}, ${alpha})`
}

function get_ms_by_day(num_of_days) {
    return num_of_days * 24 * 60 * 60 * 1000
}

/**
 * Return the javascript code used to render the chart
 * This operation is not pure thus the string returned should be guaranteed
 * that it does not contain malicious code
 *  TODO: considering to construct bar charts | fix time issue
 *
 * @returns {string} the code for rendering chartjs
 */
function render_chart(data, chart_style, sampling_rate) {
    const allowed_styles = ['line', 'scatter', 'bubble', 'bar']
    let proceed = false;
    let datasets = []

    for (let i in allowed_styles) {
        if (chart_style === allowed_styles[i]) {
            proceed = true;
        }
    }

    if (!proceed) {
        // Set Scatter as default style
        chart_style = 'scatter'
    }
    const remove_alpha = (color_str) => {
        return color_str.replace('rgba', 'rgb').split(',').reverse().slice(1).reverse().join() + ')'
    }
    let min_date = null
    let max_date = new Date(0)
    for (let i in data) {
        if (typeof i === 'undefined') break
        if (data[i].length === 0) continue;
        let data_arr = data[i]
        let current_data = {label: i, fill: chart_style === 'bubble' || chart_style === 'bar', data: []}
        if (current_data.fill) {
            current_data.backgroundColor = random_color(0.3)
            current_data.borderColor = remove_alpha(current_data.backgroundColor)
            if (chart_style === 'bubble') {
                current_data.radius = 6
                current_data.hoverRadius = 8
            } else if (chart_style === 'bar') {
                current_data.borderWidth = 1.0
            }
        } else {
           current_data.borderColor = random_color(0.7)
        }
        for (let j = 0; j < data_arr.length; ++j) {
            let current_date = new Date(data_arr[j].ts)
            if (current_date > max_date)
                max_date = current_date
            if (min_date === null || current_date < min_date)
                min_date = current_date
            current_data.data.push({x: data_arr[j].ts.toString(), y: parseFloat(data_arr[j].value_string)})
        }
        datasets.push(current_data)
    }
    let date_diff = max_date - min_date

    console.log(`${max_date} ${min_date}`)

    let x_unit = ''
    if (date_diff > get_ms_by_day(2 * 365 * sampling_rate))
        x_unit = 'year'
    else if (date_diff > get_ms_by_day(90 * sampling_rate))
        x_unit = 'quarter'
    else if (date_diff > get_ms_by_day(30 * sampling_rate))
        x_unit = 'month'
    else if (date_diff > get_ms_by_day(7 * sampling_rate))
        x_unit = 'week'
    else if (date_diff > get_ms_by_day(2 * sampling_rate))
        x_unit = 'day'
    else if (date_diff > get_ms_by_day(1 / 24 * sampling_rate))
        x_unit = 'hour'
    else if (date_diff > get_ms_by_day(1 / (24 * 60) * sampling_rate))
        x_unit = 'minute'
    else
        x_unit = 'second'

    console.log(x_unit)

    return `new Chart(ctx, {
                    type: '${chart_style}',
                    data: {
                        datasets: ${JSON.stringify(datasets)}, 
                    }, 
                    options: {
                        scales: {
                            xAxes: [
                                {
                                    type: 'time',
                                    time: {
                                        unit: '${x_unit}',
                                        unitStepSize: 1,
                                        displayFormats: {
                                            'millisecond': '',
                                            'second': 'MMM DD',
                                            'minute': 'MMM DD',
                                            'hour': 'MMM DD',
                                            'day': 'MMM DD',
                                            'week': 'MMM DD',
                                            'month': 'MMM DD',
                                            'quarter': 'MMM DD',
                                            'year': 'MMM DD',
                                        }
                                    }
                                }]
                        }
                    }
                })`
}

router.get('/', async (ctx, next) => {
    const topic_names = await TopicSnap.find_all()
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
    let params = ctx.request.body
    let topic = params.topic
    let date_start = params.time_start.date
    let time_start = params.time_start.time
    let date_end = params.time_end.date
    let time_end = params.time_end.time
    let sample_rate = params.sample_rate

    const datetime_start = new Date(`${date_start} ${time_start}`)
    const datetime_end = new Date(`${date_end} ${time_end}`)

    // Validate parameters passed to middle-end
    if (datetime_start > datetime_end) {
        ctx.body = {
            status: 'error',
            message: 'Error: Time end is before time start'
        }
    } else {
        // Get topic id and make into a map from names to ids
        topic.sort((x, y) => {
            return x.length - y.length
        })

        let name_set = new Set()
        let topic_id_map = {}

        for (let i = 0; i < topic.length; ++i) {
            if (!name_set.has(topic[i])) {
                let similar_names = (await TopicSnap.get_by_name_like(topic[i]))
                for (let j = 0; j < similar_names.length; ++j) {
                    name_set.add(similar_names[j].topic_name)
                    topic_id_map[similar_names[j].topic_name] = similar_names[j].topic_id
                }
            }
        }

        let data_list = []
        let item_count = 0
        for (let each in topic_id_map) {
            if (typeof each !== 'undefined') {
                data_list[each] = (await DataSnap.get_data_by_tid(topic_id_map[each], {
                    ts: {
                        [Op.lt]: datetime_end,
                        [Op.gt]: datetime_start
                    }
                }))
                item_count += data_list[each].length
            }
        }

        if (item_count === 0) {
            ctx.body = {
                status: 'error', message: 'No data to display'
            }
        } else {
            ctx.body = {
                status: 'success', message: 'Success!', chart: render_chart(data_list, params.chart_style, sample_rate)
            }
        }
    }
})

module.exports = router
