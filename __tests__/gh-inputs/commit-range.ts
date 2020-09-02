jest.mock("../../src/gh-inputs/pr")
jest.mock("../../src/gh-inputs/simple")

import { mocked } from "ts-jest/utils"
import { getCommitRange } from "../../src/gh-inputs/commit-range"
import { getPrCommitRange as _getPrCommitRange } from "../../src/gh-inputs/pr"
import { getManualCommitRange as _getManualCommitRange } from "../../src/gh-inputs/simple"

const getPrCommitRange = mocked(_getPrCommitRange)
const getManualCommitRange = mocked(_getManualCommitRange)

beforeEach(() => {
    jest.resetAllMocks()
})

test("return null if no commit range sources are given", () => {
    getPrCommitRange.mockReturnValueOnce(null)
    getManualCommitRange.mockReturnValueOnce(null)

    const res = getCommitRange()

    expect(res).toBe(null)
    expect(getPrCommitRange).toHaveBeenCalledTimes(1)
    expect(getManualCommitRange).toHaveBeenCalledTimes(1)
})

test("return manual if only it is given", () => {
    getPrCommitRange.mockReturnValueOnce(null)
    getManualCommitRange.mockReturnValueOnce({ fromRef: "fr", toRef: "tr" })

    const res = getCommitRange()

    expect(res).toEqual({ fromRef: "fr", toRef: "tr" })
    expect(getPrCommitRange).toHaveBeenCalledTimes(1)
    expect(getManualCommitRange).toHaveBeenCalledTimes(1)
})

test("return pr if only it is given", () => {
    getPrCommitRange.mockReturnValueOnce({ fromRef: "fr", toRef: "tr" })
    getManualCommitRange.mockReturnValueOnce(null)

    const res = getCommitRange()

    expect(res).toEqual({ fromRef: "fr", toRef: "tr" })
    expect(getPrCommitRange).toHaveBeenCalledTimes(1)
    expect(getManualCommitRange).toHaveBeenCalledTimes(1)
})

test("throw error if both are given", () => {
    getPrCommitRange.mockReturnValueOnce({ fromRef: "fr", toRef: "tr" })
    getManualCommitRange.mockReturnValueOnce({ fromRef: "fr2", toRef: "tr2" })

    const exp = expect(() => getCommitRange())
    exp.toThrowError("includePrCommits")
    exp.toThrowError("includeCommitsFromGit")
})

test("throw error if both are given even if equal", () => {
    getPrCommitRange.mockReturnValueOnce({ fromRef: "fr", toRef: "tr" })
    getManualCommitRange.mockReturnValueOnce({ fromRef: "fr", toRef: "tr" })

    expect(() => getCommitRange()).toThrowError()
})
