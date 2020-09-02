jest.mock("@actions/core")
jest.mock("../../src/gpg")

import { getInput as _getInput } from "@actions/core"
import { mocked } from "ts-jest/utils"
import {
    getBoolean,
    getCollectFromGitOption,
    getManualCommitRange,
    getStringList,
    getTrustLevel
} from "../../src/gh-inputs/simple"
import { CollectTagsFromGitOption } from "../../src/git"
import { TrustLevel, trustLevelFromString as _trustLevelFromString } from "../../src/gpg"

const getInput = mocked(_getInput)
const trustLevelFromString = mocked(_trustLevelFromString)

describe("gh-inputs/simple", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe("getBoolean", () => {
        test.each([
            ["true", true],
            ["false", false],
            ["", null]
        ])("input of %s leads to an output of %s", (rawInput, expectedResult) => {
            getInput.mockReturnValueOnce(rawInput)
            const res = getBoolean("anyName", { required: false })

            expect(res).toBe(expectedResult)
            expect(getInput).toHaveBeenCalledWith("anyName", { required: false })
            expect(getInput).toHaveBeenCalledTimes(1)
        })

        test("malformed raw input throw an exceptions", () => {
            getInput.mockReturnValueOnce("1")
            expect(() => getBoolean("anyName")).toThrowError("malformed boolean input")
        })
    })

    describe("getTrustLevel", () => {
        test("return null on empty input", () => {
            getInput.mockReturnValueOnce("")

            const res = getTrustLevel("aName", { required: false })

            expect(res).toBe(null)
            expect(getInput).toHaveBeenCalledWith("aName", { required: false })
            expect(getInput).toHaveBeenCalledTimes(1)
        })

        test("forward to trustLevelFromString on input", () => {
            getInput.mockReturnValueOnce("FuLl")
            trustLevelFromString.mockReturnValueOnce(TrustLevel.Full)

            const res = getTrustLevel("anyName")

            expect(res).toBe(TrustLevel.Full)
            expect(getInput).toHaveBeenCalledWith("anyName", undefined)
            expect(getInput).toHaveBeenCalledTimes(1)
            expect(trustLevelFromString).toHaveBeenCalledWith("FuLl")
            expect(trustLevelFromString).toHaveBeenCalledTimes(1)
        })

        test("throws a error on malformed input", () => {
            getInput.mockReturnValueOnce("malformed")
            trustLevelFromString.mockReturnValueOnce(null)

            expect(() => getTrustLevel("anyName")).toThrowError("malformed TrustLevel input")
            expect(getInput).toHaveBeenCalledWith("anyName", undefined)
            expect(getInput).toHaveBeenCalledTimes(1)
            expect(trustLevelFromString).toHaveBeenLastCalledWith("malformed")
            expect(trustLevelFromString).toHaveBeenCalledTimes(1)
        })
    })

    describe("getStringList", () => {
        test.each([
            ['["a","b"]', ["a", "b"]],
            ["[]", []],
            ["", null]
        ])("returns the expected values: %s => %s", (rawInput, expectedResult) => {
            getInput.mockReturnValueOnce(rawInput)

            const res = getStringList("anyName")

            expect(res).toEqual(expectedResult)
            expect(getInput).toHaveBeenCalledWith("anyName")
            expect(getInput).toHaveBeenCalledTimes(1)
        })

        test("passing in non string JSON values will throw an error", () => {
            getInput.mockReturnValueOnce("[1,2]")

            expect(() => getStringList("anyName")).toThrowError()
            expect(getInput).toHaveBeenCalledWith("anyName")
            expect(getInput).toHaveBeenCalledTimes(1)
        })
    })

    describe("getCollectFromGitOptions", () => {
        test.each([
            ["", CollectTagsFromGitOption.ForCommits],
            ["ForCommits", CollectTagsFromGitOption.ForCommits],
            ["All", CollectTagsFromGitOption.All],
            ["None", CollectTagsFromGitOption.None],
            ["nOnE", CollectTagsFromGitOption.None]
        ])("expected input leads to expected output: %s => %s", (rawInput, expectedOutput) => {
            getInput.mockReturnValueOnce(rawInput)

            const res = getCollectFromGitOption()

            expect(res).toBe(expectedOutput)
            expect(getInput).toHaveBeenCalledWith("includeTagsFromGit")
            expect(getInput).toHaveBeenCalledTimes(1)
        })

        test("malformed input throw error", () => {
            getInput.mockReturnValueOnce("malformed")

            expect(() => getCollectFromGitOption()).toThrowError(
                "malformed CollectFromGitOption input"
            )

            expect(getInput).toHaveBeenCalledWith("includeTagsFromGit")
            expect(getInput).toHaveBeenCalledTimes(1)
        })
    })

    describe("getManualCommitRange", () => {
        test.each([
            ["", "", null],
            ["refs/from", "", { from_ref: "refs/from", to_ref: "" }],
            ["", "refs/to", { from_ref: "", to_ref: "refs/to" }],
            ["rf", "rt", { from_ref: "rf", to_ref: "rt" }]
        ])("expected input, expected output: %s => %s", (rawInput1, rawInput2, expectedOutput) => {
            getInput.mockReturnValueOnce(rawInput1)
            getInput.mockReturnValueOnce(rawInput2)

            const res = getManualCommitRange()

            expect(res).toEqual(expectedOutput)

            expect(getInput.mock.calls).toEqual([
                ["includeCommitsFromGitAfter"],
                ["includeCommitsFromGitUpTo"]
            ])
        })
    })
})
