const moment=require('moment')

// 秒数转时分秒
function formatTime(seconds) {
    let time = moment.duration(seconds, 'seconds')
    return moment({h:time.hours(), m:time.minutes(), s:time.seconds()}).format('HH:mm:ss')
}
module.exports = {
    formatTime
}
