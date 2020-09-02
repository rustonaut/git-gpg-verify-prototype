import { exec as actionExec, ExecOptions } from "@actions/exec"
import { EOL } from "os"

/** interface for any type having an add function */
export interface HasAdd<T> {
    add(val: T): any
}

/** adds all values of the second parameter to the first parameter, then returns the first parameter*/
export function addTo<T>(set: HasAdd<T>, newEntries: Iterable<T>): HasAdd<T> {
    for (const entry of newEntries) {
        set.add(entry)
    }
    return set
}

/** interface for any type having a delete function */
export interface HasDelete<T> {
    delete(val: T): any
}

/** deletes all values of the second parameter from the first parameter, then return the first parameter */
export function deleteFrom<T>(set: HasDelete<T>, removeEntries: Iterable<T>): HasDelete<T> {
    for (const entry of removeEntries) {
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
    exitCode: number
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
    const exitCode = await actionExec(cmd, params, execOptions)

    return {
        stdout,
        stderr,
        exitCode
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

/** check if a value is a string or instanceof String */
//eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isString(val: any): boolean {
    return typeof val === "string"
}

/** check if a given value is an array of strings */
//eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isStringArray(val: any): boolean {
    if (!(val instanceof Array)) {
        return false
    }

    const badIdx = val.findIndex(x => !isString(x))
    return badIdx < 0
}
