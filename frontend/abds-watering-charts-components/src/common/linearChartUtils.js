import {DateTime} from "luxon";

export const roundValue = (value) => {
    return Math.round(value * 100) / 100;
}
