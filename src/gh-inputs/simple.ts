import * as core from "@actions/core"
import { CollectTagsFromGitOption } from "../git"
import { CommitRang } from "../git/collect"
import { trustLevelFromString } from "../gpg"
import { TrustLevel } from "../gpg/interfaces"

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
export function getList(name: string): string[] {
    const val = core.getInput(name)
    if (val === "") {
        return []
    }

    return val.split(",").map(entry => entry.trim())
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
    const from_ref = core.getInput("includeCommitsFromGitAfter")
    const to_ref = core.getInput("includeCommitsFromGitUpTo")

    if (from_ref === "" && to_ref === "") {
        return null
    }
    return { from_ref, to_ref }
}
