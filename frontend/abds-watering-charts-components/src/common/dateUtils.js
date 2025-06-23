import {DateTime} from "luxon";

export const luxonDateTime = (seconds) => {
    return DateTime.fromSeconds(Number(seconds), { zone: 'utc+2' })
}

export const luxonDateTimeToString = (seconds) => {
    return DateTime.fromSeconds(Number(seconds), { zone: 'utc+2' }).toFormat("dd/MM/yyyy HH:mm:ss")
}

export const luxonDateTimeToStringCalendar = (seconds) => {
    return DateTime.fromSeconds(Number(seconds), { zone: 'utc+2' }).toFormat("yyyy-MM-dd HH:mm")
}
