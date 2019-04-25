const router = require('koa-router')()
const TopicSnap = global.db.load_snap('topic_snap')
const MetaSnap = global.db.load_snap('meta_snap')
const DataSnap = global.db.load_snap('data_snap')
const Op = (require('sequelize')).Op
const ejs = require('ejs')
const fs = require('fs')
const Utils = global.db.load_snap('common_snap')
const moment = require('moment')

/**
 * Return the javascript code used to render the chart
 * This operation is not pure thus the string returned should be guaranteed
 * that it does not contain malicious code
 *  TODO: considering to construct bar charts
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
            // Alpha for bubble and bar charts
            current_data.backgroundColor = Utils.random_color(0.3)
            current_data.borderColor = remove_alpha(current_data.backgroundColor)
            if (chart_style === 'bubble') {
                current_data.radius = 6
                current_data.hoverRadius = 8
            } else if (chart_style === 'bar') {
                current_data.borderWidth = 1.0
            }
        } else {
           current_data.borderColor = Utils.random_color(0.7)
        }
        let num_of_data = data_arr.length * sampling_rate
        let step = data_arr.length / num_of_data
        // Get date information
        for (let j = 0; j < data_arr.length; j += step) {
            let current_date = new Date(data_arr[j].ts)
            if (current_date > max_date)
                max_date = current_date
            if (min_date === null || current_date < min_date)
                min_date = current_date
            current_data.data.push({x: moment(format_time(data_arr[j].ts)).format(),
                y: parseFloat(data_arr[j].value_string)})
        }
        datasets.push(current_data)
    }
    let date_diff = max_date - min_date

    let x_unit = ''
    // Adjust the scale of the chart
    if (date_diff > Utils.get_ms_by_day(2 * 365 * sampling_rate))
        x_unit = 'year'
    else if (date_diff > Utils.get_ms_by_day(90 * sampling_rate))
        x_unit = 'quarter'
    else if (date_diff > Utils.get_ms_by_day(30 * sampling_rate))
        x_unit = 'month'
    else if (date_diff > Utils.get_ms_by_day(7 * sampling_rate))
        x_unit = 'week'
    else if (date_diff > Utils.get_ms_by_day(2 * sampling_rate))
        x_unit = 'day'
    else if (date_diff > Utils.get_ms_by_day(1 / 24 * sampling_rate))
        x_unit = 'hour'
    else if (date_diff > Utils.get_ms_by_day(1 / (24 * 60) * sampling_rate))
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
                                            'second': 'mm:ss',
                                            'minute': 'HH:mm:ss',
                                            'hour': 'HH:mm',
                                            'day': 'MMM DD HH',
                                            'week': 'MMM DD',
                                            'month': 'MMM DD',
                                            'quarter': 'MMM',
                                            'year': 'MMM',
                                        }
                                    }
                                }]
                        }
                    }
                })`
}

/**
 * Calculate statistical data (max, min and mean)
 *
 * @param data              An array of data get from database query
 * @param sampling_rate     The rate of sample points used in the calculation
 * @param topic_id_map      A map from Topic name to id
 * @returns {Promise<void>} the calculated value with unit
 */
async function calculate_stat(data, sampling_rate, topic_id_map) {
    let stat_dict = {}
    for (let i in data) {
        if (typeof i === 'undefined') break
        if (data[i].length === 0) continue;
        let data_arr = data[i]
        let topic_id = topic_id_map[i]
        stat_dict[i] ={}
        let min_value = Number.MAX_SAFE_INTEGER
        let max_value = Number.MIN_SAFE_INTEGER
        let sum = 0.0
        let num_of_data = data_arr.length * sampling_rate
        let step = data_arr.length / num_of_data
        num_of_data = 0
        for (let j = 0; j < data_arr.length; j += step) {
            let point_data = parseFloat(data_arr[j].value_string)
            sum += point_data
            min_value = Math.min(min_value, point_data)
            max_value = Math.max(max_value, point_data)
            num_of_data += 1
        }
        let meta_info = JSON.parse((await MetaSnap.get_meta_by_tid(topic_id))[0].metadata)
        stat_dict[i].unit = meta_info.units
        stat_dict[i].max = max_value
        stat_dict[i].min = min_value
        if (num_of_data !== 0)
            stat_dict[i].mean = sum / num_of_data
        else
            stat_dict[i].mean = 'NaN'
        stat_dict[i].range = max_value - min_value
    }
    return stat_dict
}

router.get('/', async (ctx, next) => {
    let dict_render = {}
    dict_render['topics'] = await Utils.get_all_categorized_topics()
    dict_render.location = 'home'
    dict_render.csrf = ctx.csrf
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
    let topics = params.topic
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
        let topic_id_map = await Utils.get_topic_id_map(topics)
        let data_list = []
        let item_count = 0
        for (let each in topic_id_map) {
            if (typeof each !== 'undefined') {
                data_list[each] = (await DataSnap.get_data_by_tid(topic_id_map[each], {
                    ts: {
                        [Op.lt]: new Date(`${datetime_end.toLocaleDateString()} ${datetime_end.toLocaleTimeString()}`),
                        [Op.gt]: new Date(`${datetime_start.toLocaleDateString()} ${datetime_start.toLocaleTimeString()}`)
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
            const path = require('path')
            const stat_content_template = fs.readFileSync(path.join('views', 'stat_content.ejs'), 'utf-8')
            ctx.body = {
                status: 'success',
                message: 'Success!',
                chart: render_chart(data_list, params.chart_style, sample_rate),
                stat_content: ejs.render(stat_content_template, {stat_data: await calculate_stat(data_list, sample_rate, topic_id_map)}),
                enable_stat: true
            }
        }
    }
})

module.exports = router
