import { exec, ExecResult } from "../utils"

/** thin wrapper around utils.exec, makes mocking easier */
export async function callGit(params: string[]): Promise<ExecResult> {
    return await exec("git", params)
}
