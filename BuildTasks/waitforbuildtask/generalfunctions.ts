/*
 * General Purpose Functions that can be reused across classes and tasks.
 */

export function sleep(ms: number): Promise<void> {
    console.log(`Sleeping for ${ms/1000} seconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}