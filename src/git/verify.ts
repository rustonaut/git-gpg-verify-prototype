import * as core from "@actions/core"
import { GpgSignature, parseRawGpgOutput } from "../gpg"
import { ErrorKind, Status, TrustLevel } from "../gpg/interfaces"
import { isTrustLevelCompatibleWithMinTrustLevel } from "../gpg/trust"
import { callGit } from "./ffi"

/** Commit or Tag? */
export enum EntityType {
    Commit = "Commit",
    Tag = "Tag"
}

/** verify-commit for commits and verify-tag for tags */
export function verificationSubCommandForType(type: EntityType): string {
    switch (type) {
        case EntityType.Commit:
            return "verify-commit"
        case EntityType.Tag:
            return "verify-tag"
    }
}

/** inspect the signatures of a commit/tag in the git repo implied by the CWD*/
export async function inspectSignatures(type: EntityType, id: string): Promise<GpgSignature[]> {
    const subCmd = verificationSubCommandForType(type)
    const out = await callGit([subCmd, "--raw", "--", id])
    //yes ignore exit_status!
    return parseRawGpgOutput(out.stderr)
}

/** Determines under which conditions signature checks fail */
export interface VerificationOptions {
    requireMinTrustLevel: TrustLevel
    requireSignature: boolean
    ignoreUnknownKeys: boolean
    ignoreUntrustedKeys: boolean
}

/** verify the signatures of a commit/tag in the git repo implied by the CWD */
export async function verify(
    type: EntityType,
    id: string,
    options: VerificationOptions
): Promise<Error[]> {
    let signatures
    try {
        signatures = await inspectSignatures(type, id)
    } catch (error) {
        if (error instanceof Error) {
            return [error]
        } else {
            return [new Error(error)]
        }
    }

    return checkSignatureList(signatures, options, `${type}(${id})`)
}

/** given a list of GpgSignature results for a given commit/tag check for errors given the given options */
export function checkSignatureList(
    signatures: GpgSignature[],
    options: VerificationOptions,
    debug_label: string
): Error[] {
    if (options.ignoreUnknownKeys) {
        signatures = filterOutUnknownKeys(signatures, debug_label)
    }

    if (options.ignoreUntrustedKeys) {
        signatures = filterOutUntrustyKeys(signatures, options.requireMinTrustLevel, debug_label)
    }

    if (options.requireSignature && signatures.length == 0) {
        return [new Error(`Requires signature but ${debug_label} has no (non ignored) signatures.`)]
    }

    const errors = []
    for (const sig of signatures) {
        const result = checkSignature(sig, options.requireMinTrustLevel, debug_label)
        if (result !== true) {
            errors.push(result)
        }
    }

    return errors
}

/** filter out all signature entries which are from unknown keys */
export function filterOutUnknownKeys(
    signatures: GpgSignature[],
    debugLabel: string
): GpgSignature[] {
    return signatures.filter(sig => {
        const keep = sig.status == Status.Valid || sig.errorKind != ErrorKind.UnknownKey
        if (!keep) core.debug(`Ignoring unknown key signature on ${debugLabel}`)
        return keep
    })
}

/** filter out all signature entries which are valid but not trusted enough */
export function filterOutUntrustyKeys(
    signatures: GpgSignature[],
    minTrustLevel: TrustLevel,
    debugLabel: string
): GpgSignature[] {
    return signatures.filter(sig => {
        const keep =
            sig.status == Status.Invalid ||
            isTrustLevelCompatibleWithMinTrustLevel(sig.trustLevel, minTrustLevel)
        if (!keep) core.debug(`Ignoring untrusted signature on ${debugLabel}`)
        return keep
    })
}

/** check if a specific signature causes errors under the given min trust level */
export function checkSignature(
    signature: GpgSignature,
    minTrustLevel: TrustLevel,
    debugLabel: string
): Error | true {
    if (signature.status == Status.Invalid) {
        return new Error(`Invalid signature for ${debugLabel} because of ${signature.errorKind}`)
    } else {
        if (!isTrustLevelCompatibleWithMinTrustLevel(signature.trustLevel, minTrustLevel)) {
            return new Error(
                `Valid but untrusted signature on ${debugLabel} had ${signature.trustLevel} but required at least ${minTrustLevel}`
            )
        }
        return true
    }
}
