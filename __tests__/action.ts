jest.mock("../src/gh-inputs")
jest.mock("../src/inner-api")
jest.mock("@actions/core")

import * as _core from "@actions/core"
import { mocked } from "ts-jest/utils"
import { runAction } from "../src/action"
import { parseGithubActionInputs as _parseGithubActionInputs } from "../src/gh-inputs"
import { CollectTagsFromGitOption } from "../src/git"
import { TrustLevel } from "../src/gpg"
import { collectAndVerify as _collectAndVerify, Options } from "../src/inner-api"

const parseGithubActionInputs = mocked(_parseGithubActionInputs)
const collectAndVerify = mocked(_collectAndVerify)
const core = mocked(_core, true)

const mockOptions: Options = {
    collection: {
        forCommits: {
            explicitlyInclude: ["abc"],
            includeInRange: { fromRef: "/ref/from", toRef: "/ref/to" },
            explicitlyExclude: ["def"]
        },
        forTags: {
            explicitlyInclude: ["v0"],
            includeFromGit: CollectTagsFromGitOption.All,
            explicitlyExclude: ["v102"],
            filterRegex: null
        }
    },
    verification: {
        forCommits: {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false
        },
        forTags: {
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

describe("run_action", () => {
    test("calls the inner api with parsed inputs", async () => {
        parseGithubActionInputs.mockReturnValueOnce(mockOptions)
        collectAndVerify.mockResolvedValueOnce({
            tags: new Set(),
            commits: new Set(),
            errors: []
        })

        await runAction()

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

        await runAction()

        expect(core.error.mock.calls).toEqual([["msg1"], ["msg2"]])
    })

    test("if there are errors setFailed is called", async () => {
        parseGithubActionInputs.mockReturnValueOnce(mockOptions)
        collectAndVerify.mockResolvedValueOnce({
            tags: new Set(),
            commits: new Set(),
            errors: [new Error("msg1"), new Error("msg2")]
        })

        await runAction()

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

        await runAction()

        expect(core.setOutput).toHaveBeenCalledWith(
            "verified-commits",
            new Set(["commit0", "commit1"])
        )
        expect(core.setOutput).toHaveBeenCalledWith("verified-tags", new Set(["v0", "v1"]))
        expect(core.setOutput).toHaveBeenCalledTimes(2)
    })
})
