jest.mock("../src/git/verify")

import { mocked } from "ts-jest/utils"
import {
    CommitsAndTags,
    EntityType,
    TagVerificationOptions,
    VerificationOptions,
    verifyAll,
    verifyCommitsAndTags
} from "../src/git"
import { verify as _verify } from "../src/git/verify"
import { TrustLevel } from "../src/gpg"

const verify = mocked(_verify)

describe("verifyCommitsAndTags", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    test("calls verifyAll for commits and tags", async () => {
        const options: VerificationOptions = {
            forTags: {
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: false,
                requireMinTrustLevel: TrustLevel.Full,
                requireSignature: false
            },
            forCommits: {
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: false,
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false
            }
        }

        const commitsAndTags: CommitsAndTags = {
            commits: new Set(["abcdef", "ghijk"]),
            tags: new Set(["v0", "v1", "v2"])
        }

        verify.mockResolvedValueOnce([new Error("a"), new Error("b")])
        verify.mockResolvedValueOnce([])
        verify.mockResolvedValueOnce([new Error("c")])
        verify.mockResolvedValueOnce([])
        verify.mockResolvedValueOnce([new Error("d")])

        const _res = await verifyCommitsAndTags(commitsAndTags, options)
        const res = new Set(_res.map(err => err.message))
        expect(res).toEqual(new Set(["a", "b", "c", "d"]))
        //use _res as set deduplicates
        expect(_res.length).toBe(4)

        expect(verify).toHaveBeenCalledTimes(5)
        expect(verify).toHaveBeenCalledWith(EntityType.Commit, "abcdef", options.forCommits)
        expect(verify).toHaveBeenCalledWith(EntityType.Commit, "ghijk", options.forCommits)
        expect(verify).toHaveBeenCalledWith(EntityType.Tag, "v0", options.forTags)
        expect(verify).toHaveBeenCalledWith(EntityType.Tag, "v1", options.forTags)
        expect(verify).toHaveBeenCalledWith(EntityType.Tag, "v2", options.forTags)
    })
})

describe("verifyAll", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    test("calls verify on all ids and concatenates errors", async () => {
        const options: TagVerificationOptions = {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false
        }
        const ids = new Set(["v1", "v2"])
        const _ids = new Set(ids)

        verify.mockResolvedValueOnce([new Error("a"), new Error("b")])
        verify.mockResolvedValueOnce([new Error("c")])

        const _res = await verifyAll(EntityType.Tag, ids, options)
        const res = new Set(_res.map(err => err.message))
        expect(res).toEqual(new Set(["a", "b", "c"]))
        //use _res as set deduplicates
        expect(_res.length).toBe(3)

        expect(verify).toHaveBeenCalledTimes(2)
        expect(verify).toHaveBeenCalledWith(EntityType.Tag, "v1", options)
        expect(verify).toHaveBeenCalledWith(EntityType.Tag, "v2", options)
        expect(ids).toEqual(_ids)
    })
})
