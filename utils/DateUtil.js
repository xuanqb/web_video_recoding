function formatTime(seconds) {
    const hour = Math.floor(seconds / 3600);
    const minute = Math.floor((seconds - hour * 3600) / 60);
    const second = seconds - hour * 3600 - minute * 60;
    return (
        ("0" + hour).slice(-2) +
        ":" +
        ("0" + minute).slice(-2) +
        ":" +
        ("0" + second).slice(-2)
    );
}
module.exports = {
    formatTime
}
