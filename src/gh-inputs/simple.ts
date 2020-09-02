import * as core from "@actions/core"
import { CollectTagsFromGitOption } from "../git"
import { CommitRang } from "../git/collect"
import { trustLevelFromString } from "../gpg"
import { TrustLevel } from "../gpg/interfaces"
import { isStringArray } from "../utils"

/** get's a boolean github action input from the environment */
export function getBoolean(name: string, options?: core.InputOptions): boolean | null {
    const val = core.getInput(name, options)
    if (val === "") {
        return null
    }

    switch (val.toLowerCase()) {
        case "true":
            return true
        case "false":
            return false
        default:
            throw new Error("malformed boolean input")
    }
}

/** get's a TrustLevel github action input from the environment */
export function getTrustLevel(name: string, options?: core.InputOptions): TrustLevel | null {
    const val = core.getInput(name, options)
    if (val === "") {
        return null
    }

    const trustLevel = trustLevelFromString(val)
    if (trustLevel === null) {
        throw new Error("malformed TrustLevel input")
    }
    return trustLevel
}

/** get's a list github action input from the environment */
export function getStringList(name: string): string[] | null {
    const val = core.getInput(name)
    if (val === "") {
        return null
    }

    const res = JSON.parse(val)

    if (!isStringArray(res)) {
        throw new Error(`expected array of string for ${name}`)
    }

    return res
}

/** gest a CollectTagsFromGitOption github action input from the environment */
export function getCollectFromGitOption(): CollectTagsFromGitOption {
    const input = core.getInput("includeTagsFromGit")
    switch (input.toLowerCase()) {
        case "":
        case "forcommits":
            return CollectTagsFromGitOption.ForCommits
        case "none":
            return CollectTagsFromGitOption.None
        case "all":
            return CollectTagsFromGitOption.All
        default:
            throw new Error(
                "malformed CollectFromGitOption input. Need to be either of None, All or ForCommits"
            )
    }
}

/** get the manually defined commit rang github action input(s) from the environment */
export function getManualCommitRange(): CommitRang | null {
    const fromRef = core.getInput("includeCommitsFromGitAfter")
    const toRef = core.getInput("includeCommitsFromGitUpTo")

    if (fromRef === "" && toRef === "") {
        return null
    }
    return { fromRef, toRef }
}
