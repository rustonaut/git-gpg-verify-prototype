import { exec as action_exec, ExecOptions } from "@actions/exec"
import { EOL } from "os"

/** returns a set of all lines in the input, each line is trimmed */
export function trimmedLineSet(lines: string): Set<string> {
    const parts = lines.split(EOL).map((s) => s.trim())
    if (lines.endsWith(EOL)) {
        // or we have a unwanted additional "",
        // note that we need to do the check before running
        // trim as in case of `a${EOL}  ` we want an "" entry.
        parts.pop()
    }
    return new Set(parts)
}

/** the result of calling (utils.) exec */
export interface ExecResult {
    /** captured stdout */
    stdout: string,
    /** captured stderr */
    stderr: string,
    /** exit code of running command */
    exit_code: number
}

/** execute a given command and capture stdout,stderr and the exit code */
export async function exec(
    cmd: string,
    params: string[]
): Promise<ExecResult> {
    let stdout = ""
    let stderr = ""
    const execOptions: ExecOptions = {
        listeners: {
            stdout: (data: Buffer) => {
                stdout += data.toString()
            },
            stderr: (data: Buffer) => {
                stderr += data.toString()
            }
        }
    }
    const exit_code = await action_exec(cmd, params, execOptions)

    return {
        stdout,
        stderr,
        exit_code
    }
}