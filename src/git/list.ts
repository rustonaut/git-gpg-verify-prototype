import { addAllTo, trimmedLineSet } from "../utils"
import { callGit } from "./ffi"

/** list all tags for the git repo implied by the current working directory (CWD)*/
export async function listAllTags(): Promise<Set<string>> {
    const out = await callGit(["tag", "--list"])
    if (out.exit_code != 0) {
        throw new Error("Running git list all tags failed")
    }

    return trimmedLineSet(out.stdout)
}

/** list all tags attached to a specific commit in the git repo implied by CWD */
export async function listTagsForCommit(commit: string): Promise<Set<string>> {
    const out = await callGit(["tag", "--list", "--points-at", commit])
    if (out.exit_code != 0) {
        throw new Error("Running git listTagsForCommits failed")
    }
    return trimmedLineSet(out.stdout)
}

/** list all tags attached to any of a list of commits in the git repo implied by CWD*/
export async function listTagsForCommits(commits: Iterable<string>): Promise<Set<string>> {
    const tags: Set<string> = new Set()
    for (const commit of commits) {
        const new_tags = await listTagsForCommit(commit)
        addAllTo(tags, new_tags)
    }
    return tags
}