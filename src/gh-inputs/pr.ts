import { CommitRang } from "../git/collect"
import { getBoolean } from "./simple"

export function getPrCommitRange(): CommitRang | null {
    const doGetPrRange = getBoolean("includePrCommits")
    if (doGetPrRange === null || doGetPrRange === false) {
        return null
    }
    const from_ref = getFixedGithubBaseRef()
    const to_ref = getFixedGithubRef()
    return { from_ref, to_ref }
}

export function getFixedGithubBaseRef(): string {
    const ref = process.env["GITHUB_BASE_REF"]
    if (!ref) {
        throw new Error("if includePrCommits is used GITHUB_BASE_REF must be used")
    }
    return fixGithubBaseRef(ref)
}

export function getFixedGithubRef(): string {
    const ref = process.env["GITHUB_REF"]
    if (!ref) {
        throw new Error("if includePrCommits is used GITHUB_REF must be used")
    }
    return fixGithubRef(ref)
}

/** fix GITHUB_BASE_REF value */
export function fixGithubBaseRef(ref: string): string {
    if (!ref.startsWith("refs/")) {
        // GITHUB_BASE_REF is often the branch name, but because of how the
        // checkout action did the checkout we can't use the branch name
        // (there is no symlink to a proper ref)
        return `refs/remotes/origin/${ref}`
    }
    return ref
}

/** fix GITHUB_REF value */
export function fixGithubRef(ref: string): string {
    if (ref.startsWith("refs/pull/")) {
        // GIBUT_REF is often refs/pull/... but because of how checkout does the checkout
        // there is no link refs/pull actually available but we have refs/remote/pull/...
        const tail = ref.substring(5)
        return `refs/remotes/${tail}`
    }
    return ref
}
