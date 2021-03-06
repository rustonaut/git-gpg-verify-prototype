import { addTo, trimmedLineSet } from "../utils"
import { callGit } from "./ffi"

/** list all tags for the git repo implied by the current working directory (CWD)*/
export async function listAllTags(): Promise<Set<string>> {
    const out = await callGit(["tag", "--list"])
    if (out.exitCode != 0) {
        throw new Error(`Running git list all tags failed ${out.exitCode}`)
    }

    return trimmedLineSet(out.stdout)
}

/** list all tags attached to a specific commit in the git repo implied by CWD */
export async function listTagsForCommit(commit: string): Promise<Set<string>> {
    const out = await callGit(["tag", "--list", "--points-at", commit])
    if (out.exitCode != 0) {
        throw new Error("Running git listTagsForCommits failed")
    }
    return trimmedLineSet(out.stdout)
}

/** list all tags attached to any of a list of commits in the git repo implied by CWD*/
export async function listTagsForCommits(commits: Iterable<string>): Promise<Set<string>> {
    const tags: Set<string> = new Set()
    for (const commit of commits) {
        const newTags = await listTagsForCommit(commit)
        addTo(tags, newTags)
    }
    return tags
}

/** list all commits in the given range of commits (using rev-list and .. range) */
export async function listCommitsInRange(startRef: string, endRef: string): Promise<Set<string>> {
    let range
    if (startRef == "") {
        range = endRef
    } else {
        range = `${startRef}..${endRef}`
    }
    const out = await callGit(["rev-list", range])
    if (out.exitCode != 0) {
        throw new Error("Running git list commits in range failed")
    }
    return trimmedLineSet(out.stdout)
}
