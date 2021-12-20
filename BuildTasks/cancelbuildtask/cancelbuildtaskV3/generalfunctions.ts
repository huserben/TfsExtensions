/*
 * General Purpose Functions that can be reused across classes and tasks.
 */

export interface IGeneralFunctions {
    sleep(ms: number): Promise<void>;
    trimValues(values: string[]): string[];
    trimValue(value: string): string;
}

export class GeneralFunctions implements IGeneralFunctions {
    public sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }



    public trimValues(values: string[]): string[] {
        var returnValue: string[] = [];

        if (values != null) {
            values.forEach(value => {
                returnValue.push(this.trimValue(value));
            });
        }

        return returnValue;
    }

    public trimValue(value: string): string {
        if (value !== null && value !== undefined) {
            return value.trim();
        }

        return value;
    }
}