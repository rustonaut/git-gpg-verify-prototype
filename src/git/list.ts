import { trimmedLineSet } from "../utils"
import { callGit } from "./ffi"

export async function listAllTags(): Promise<Set<string>> {
    const out = await callGit(["tag", "--list"])
    if (out.exit_code != 0) {
        throw new Error("Running git list all tags failed")
    }

    return trimmedLineSet(out.stdout)
}