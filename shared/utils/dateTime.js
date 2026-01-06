"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getISTDate = getISTDate;
exports.formatIST = formatIST;
exports.formatDateIST = formatDateIST;
exports.formatTimeIST = formatTimeIST;
exports.formatDateTimeIST = formatDateTimeIST;
exports.createISTDate = createISTDate;
exports.getNextBusinessDay = getNextBusinessDay;
exports.isBusinessDay = isBusinessDay;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const IST_TIMEZONE = 'Asia/Kolkata';
function getISTDate(date) {
    const now = date || new Date();
    return (0, date_fns_tz_1.utcToZonedTime)(now, IST_TIMEZONE);
}
function formatIST(date, formatStr = 'PPPp') {
    return (0, date_fns_tz_1.formatInTimeZone)(date, IST_TIMEZONE, formatStr);
}
function formatDateIST(date) {
    return formatIST(date, 'EEEE, MMMM d, yyyy');
}
function formatTimeIST(date) {
    return formatIST(date, 'h:mm a');
}
function formatDateTimeIST(date) {
    return formatIST(date, 'EEEE, MMMM d, yyyy h:mm a');
}
function createISTDate(year, month, day, hour, minute) {
    const date = new Date(year, month - 1, day, hour, minute);
    return (0, date_fns_tz_1.zonedTimeToUtc)(date, IST_TIMEZONE);
}
function getNextBusinessDay(date = new Date()) {
    let nextDay = (0, date_fns_1.addDays)(date, 1);
    const istDate = getISTDate(nextDay);
    const dayOfWeek = istDate.getDay();
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0) {
        nextDay = (0, date_fns_1.addDays)(nextDay, 1);
    }
    else if (dayOfWeek === 6) {
        nextDay = (0, date_fns_1.addDays)(nextDay, 2);
    }
    return nextDay;
}
function isBusinessDay(date) {
    const istDate = getISTDate(date);
    const dayOfWeek = istDate.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
}
//# sourceMappingURL=dateTime.js.map