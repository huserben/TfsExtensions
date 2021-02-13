"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const common = require("../generalfunctions");
describe("General Functions Tests", function () {
    var generalFunctions;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        generalFunctions = new common.GeneralFunctions();
        this.timeout(1000);
    }));
    it("should remove trailing whitespace of a value", () => {
        let testString = "blergon";
        var actual = generalFunctions.trimValue(`${testString}   `);
        assert.equal(testString, actual);
    });
    it("should remove leading whitespace of a value", () => {
        let testString = "blergon";
        var actual = generalFunctions.trimValue(`   ${testString}`);
        assert.equal(testString, actual);
    });
    it("should handle null value", () => {
        let testString = null;
        var actual = generalFunctions.trimValue(testString);
        assert.equal(null, actual);
    });
    it("should handle undefined value", () => {
        let testString = undefined;
        var actual = generalFunctions.trimValue(testString);
        assert.equal(undefined, actual);
    });
    it("should trim all values of an array", () => {
        let testString = "blergon";
        let testStrings = [
            `   ${testString}`,
            `${testString}    `,
            testString,
            `   ${testString}    `
        ];
        var actualValues = generalFunctions.trimValues(testStrings);
        actualValues.forEach(value => assert.equal(testString, value));
    });
    it("should return empty array if it is null", () => {
        let testStrings = null;
        var actualValues = generalFunctions.trimValues(testStrings);
        assert.equal(0, actualValues.length);
    });
    it("should ignore null and undefined values of passed array", () => {
        let testString = "blergon";
        let testStrings = [
            `${testString}`,
            null,
            undefined
        ];
        var actualValues = generalFunctions.trimValues(testStrings);
        assert.equal(testString, actualValues[0]);
        assert.equal(null, actualValues[1]);
        assert.equal(undefined, actualValues[2]);
    });
});
