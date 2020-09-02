jest.mock("../src/gh-inputs")
jest.mock("../src/inner-api")
jest.mock("@actions/core")

import * as _core from "@actions/core"
import { mocked } from "ts-jest/utils"
import { run_action } from "../src/action"
import { parseGithubActionInputs as _parseGithubActionInputs } from "../src/gh-inputs"
import { CollectTagsFromGitOption } from "../src/git"
import { TrustLevel } from "../src/gpg"
import { collectAndVerify as _collectAndVerify, Options } from "../src/inner-api"

const parseGithubActionInputs = mocked(_parseGithubActionInputs)
const collectAndVerify = mocked(_collectAndVerify)
const core = mocked(_core, true)

const mockOptions: Options = {
    collection: {
        for_commits: {
            explicitly_include: ["abc"],
            include_in_range: { from_ref: "/ref/from", to_ref: "/ref/to" },
            explicitly_exclude: ["def"]
        },
        for_tags: {
            explicitly_include: ["v0"],
            include_from_git: CollectTagsFromGitOption.All,
            explicitly_exclude: ["v102"],
            filter_regex: null
        }
    },
    verification: {
        for_commits: {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false
        },
        for_tags: {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Full,
            requireSignature: true
        }
    }
}

beforeEach(() => {
    jest.resetAllMocks()
})

//TODO change includedCommits/Tags to accept JSON array instead of
//     stringly array.

describe("run_action", () => {
    test("calls the inner api with parsed inputs", async () => {
        parseGithubActionInputs.mockReturnValueOnce(mockOptions)
        collectAndVerify.mockResolvedValueOnce({
            tags: new Set(),
            commits: new Set(),
            errors: []
        })

        await run_action()

        expect(parseGithubActionInputs).toHaveBeenCalledTimes(1)
        expect(collectAndVerify).toHaveBeenCalledWith(mockOptions)
        expect(collectAndVerify).toHaveBeenCalledTimes(1)
    })

    test("all error messages are logged with core.error", async () => {
        parseGithubActionInputs.mockReturnValueOnce(mockOptions)
        collectAndVerify.mockResolvedValueOnce({
            tags: new Set(),
            commits: new Set(),
            errors: [new Error("msg1"), new Error("msg2")]
        })

        await run_action()

        expect(core.error.mock.calls).toEqual([["msg1"], ["msg2"]])
    })

    test("if there are errors setFailed is called", async () => {
        parseGithubActionInputs.mockReturnValueOnce(mockOptions)
        collectAndVerify.mockResolvedValueOnce({
            tags: new Set(),
            commits: new Set(),
            errors: [new Error("msg1"), new Error("msg2")]
        })

        await run_action()

        expect(core.setFailed).toHaveBeenCalledWith(
            "Signature verifications failed in at least one case."
        )
        expect(core.setFailed).toHaveBeenCalledTimes(1)
    })

    test("if there are no errors setOutput is used to set commits and tags output", async () => {
        parseGithubActionInputs.mockReturnValueOnce(mockOptions)
        collectAndVerify.mockResolvedValueOnce({
            tags: new Set(["v0", "v1"]),
            commits: new Set(["commit0", "commit1"]),
            errors: []
        })

        await run_action()

        expect(core.setOutput).toHaveBeenCalledWith(
            "verified-commits",
            new Set(["commit0", "commit1"])
        )
        expect(core.setOutput).toHaveBeenCalledWith("verified-tags", new Set(["v0", "v1"]))
        expect(core.setOutput).toHaveBeenCalledTimes(2)
    })
})
