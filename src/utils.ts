import { exec as action_exec, ExecOptions } from "@actions/exec"
import { EOL } from "os"

/** interface for any type having an add function */
export interface HasAdd<T> {
    add(val: T): any
}

/** adds all values of the second parameter to the first parameter, then returns the first parameter*/
export function addTo<T>(set: HasAdd<T>, new_entries: Iterable<T>): HasAdd<T> {
    for (const entry of new_entries) {
        set.add(entry)
    }
    return set
}

/** interface for any type having a delete function */
export interface HasDelete<T> {
    delete(val: T): any
}

/** deletes all values of the second parameter from the first parameter, then return the first parameter */
export function deleteFrom<T>(set: HasDelete<T>, remove_entries: Iterable<T>): HasDelete<T> {
    for (const entry of remove_entries) {
        set.delete(entry)
    }
    return set
}

/** returns a set of all lines in the input, each line is trimmed */
export function trimmedLineSet(lines: string): Set<string> {
    if (lines.length == 0 || lines == EOL) {
        return new Set()
    }
    const parts = lines.split(EOL).map(s => s.trim())
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
    stdout: string
    /** captured stderr */
    stderr: string
    /** exit code of running command */
    exit_code: number
}

/** execute a given command and capture stdout,stderr and the exit code */
export async function exec(cmd: string, params: string[]): Promise<ExecResult> {
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

/** split string once from the back */
export function rSplitOnce(input: string, split: string): [string] | [string, string] {
    const pos = input.lastIndexOf(split)
    if (pos < 0) {
        return [input]
    }

    return [input.substring(0, pos), input.substring(pos + 1)]
}
