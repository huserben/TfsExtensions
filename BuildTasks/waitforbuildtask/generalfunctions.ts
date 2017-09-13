/*
 * General Purpose Functions that can be reused across classes and tasks.
 */

export function sleep(ms: number): Promise<void> {
    console.log(`Sleeping for ${ms/1000} seconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}



export function trimValues(values: string[]): string[] {
    var returnValue: string[] = [];

    if (values != null) {
        values.forEach(value => {
            returnValue.push(trimValue(value));
        });
    }

    return returnValue;
}

export function trimValue(value : string): string {
    if (value !== null && value !== undefined) {
        return value.trim();
    }

    return value;
}