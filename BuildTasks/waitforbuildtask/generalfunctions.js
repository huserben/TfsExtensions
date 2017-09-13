"use strict";
/*
 * General Purpose Functions that can be reused across classes and tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function sleep(ms) {
    console.log(`Sleeping for ${ms / 1000} seconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function trimValues(values) {
    var returnValue = [];
    if (values != null) {
        values.forEach(value => {
            returnValue.push(trimValue(value));
        });
    }
    return returnValue;
}
exports.trimValues = trimValues;
function trimValue(value) {
    if (value !== null && value !== undefined) {
        return value.trim();
    }
    return value;
}
exports.trimValue = trimValue;
