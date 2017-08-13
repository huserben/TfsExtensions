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
