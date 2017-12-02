import * as assert from "assert";
import common = require("../generalfunctions");

describe("General Functions Tests", function (): void {
    var generalFunctions: common.IGeneralFunctions;

    beforeEach(async () => {
        generalFunctions = new common.GeneralFunctions();
        this.timeout(1000);
    });

    it("should remove trailing whitespace of a value", () => {
        let testString: string = "blergon";

        var actual: string = generalFunctions.trimValue(`${testString}   `);

        assert.equal(testString, actual);
    });

    it("should remove leading whitespace of a value", () => {
        let testString: string = "blergon";

        var actual: string = generalFunctions.trimValue(`   ${testString}`);

        assert.equal(testString, actual);
    });

    it("should handle null value", () => {
        let testString: any = null;
        var actual: string = generalFunctions.trimValue(testString);

        assert.equal(null, actual);
    });

    it("should handle undefined value", () => {
        let testString: any = undefined;
        var actual: string = generalFunctions.trimValue(testString);

        assert.equal(undefined, actual);
    });

    it("should trim all values of an array", () => {
        let testString: string = "blergon";
        let testStrings: string[] = [
            `   ${testString}`,
            `${testString}    `,
            testString,
            `   ${testString}    `
        ];

        var actualValues: string[] = generalFunctions.trimValues(testStrings);

        actualValues.forEach(value => assert.equal(testString, value));
    });

    it("should return empty array if it is null", () => {
        let testStrings: any = null;

        var actualValues: string[] = generalFunctions.trimValues(testStrings);

        assert.equal(0, actualValues.length);
    });

    it("should ignore null and undefined values of passed array", () => {
        let testString: string = "blergon";
        let testStrings: any[] = [
            `${testString}`,
            null,
            undefined];

        var actualValues: string[] = generalFunctions.trimValues(testStrings);

        assert.equal(testString, actualValues[0]);
        assert.equal(null, actualValues[1]);
        assert.equal(undefined, actualValues[2]);
    });
});