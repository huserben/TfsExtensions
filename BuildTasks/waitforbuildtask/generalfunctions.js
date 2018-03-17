"use strict";
/*
 * General Purpose Functions that can be reused across classes and tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
class GeneralFunctions {
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    trimValues(values) {
        var returnValue = [];
        if (values != null) {
            values.forEach(value => {
                returnValue.push(this.trimValue(value));
            });
        }
        return returnValue;
    }
    trimValue(value) {
        if (value !== null && value !== undefined) {
            return value.trim();
        }
        return value;
    }
}
exports.GeneralFunctions = GeneralFunctions;
