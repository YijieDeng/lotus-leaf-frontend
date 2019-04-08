// Plugin initializations
$('.collapsible').collapsible();
$('select').formSelect();
$('.datepicker').datepicker();
$('.timepicker').timepicker();
$('.modal').modal();
var ctx = document.getElementById("chart").getContext('2d');
var canvas = document.getElementById("chart")
// Post data to middle-end and present error message or plot
// the data given by the backend.
window.chart = new Chart(ctx, {});
$("#submit-query").on("click", function() {
    let topic_select = $('#topic-select').val()
    let alert_text = document.getElementById('alert-text')
    let from_time = document.getElementById('from-time')
    let from_date = document.getElementById('from-date')
    let to_time = document.getElementById('to-time')
    let to_date = document.getElementById('to-date')
    let sample_rate = parseFloat(document.getElementById('sample-rate').value)
    if (topic_select.length === 0) {
        alert_text.innerText = 'Please select a Topic'
        $('#alert-modal').modal('open')
    } else if (from_date.value === '' || to_date.value === '') {
        alert_text.innerText = 'Please enter the dates'
        $('#alert-modal').modal('open')
    } else if (from_time.value === '' || to_time.value === '') {
        alert_text.innerText = 'Please enter the times'
        $('#alert-modal').modal('open')
    } else if (isNaN(sample_rate) || sample_rate < 0.0 || sample_rate > 1.0) {
        alert_text.innerText = 'Sample rate should be in (0.0, 1.0)'
        $('#alert-modal').modal('open')
    } else {
        M.toast({html: 'Fetching Data...', classes: 'rounded'})
        $('#pre-loader').css('visibility', 'visible')
        let post_data = {
            topic: topic_select,
            time_start: {
                time: from_time.value,
                date: from_date.value
            },
            time_end: {
                time: to_time.value,
                date: to_date.value
            },
            sample_rate: sample_rate ,
            chart_style: $('#chart-style-select').val()
        }
        $.post('/query', post_data, function (data, status) {
            M.Toast.dismissAll();
            M.toast({html: data.message, classes: 'rounded'})
            $('#pre-loader').hide()
            if (data.enable_stat) {
                $('#show-stat').css('visibility', 'visible')
            }
            if (data.status !== 'error') {
                $('.collapsible').collapsible('close')
                $('#chart-wrapper').css('visibility', 'visible')
                // Clear the canvas first
                window.chart.destroy()
                window.chart = eval(data.chart)
                if ($('#stat-collapsible')) {
                    $('#stat-collapsible').remove()
                }
                $('#stat-content-wrapper').prepend(data.stat_content)
                $('#stat-collapsible').collapsible()
            }
        })
    }
})