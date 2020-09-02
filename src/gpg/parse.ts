import * as core from "@actions/core"
import { EOL } from "os"
import { ErrorKind, GpgSignature, Status, TrustLevel } from "./interfaces"

/** parses a string (case insensitive) into a TrustLevel enum variant if possible */
export function trustLevelFromString(input: string): TrustLevel | null {
    switch (input.toUpperCase()) {
        case "NEVER":
            return TrustLevel.Never
        case "UNDEFINED":
            return TrustLevel.Undefined
        case "UNKNOWN":
            return TrustLevel.Unknown
        case "MARGINAL":
            return TrustLevel.Marginal
        case "FULL":
            return TrustLevel.Full
        case "ULTIMATE":
            return TrustLevel.Ultimate
        default:
            return null
    }
}

class ParsingSigState {
    inputForErrorDebugMsg: string
    trustLevel: TrustLevel | null
    errorKind: ErrorKind | null
    foundGoodSig: boolean

    constructor(inputForErrorDebugMsg: string) {
        this.trustLevel = null
        this.errorKind = null
        this.foundGoodSig = false
        this.inputForErrorDebugMsg = inputForErrorDebugMsg
    }

    reset(): void {
        const initalState = new ParsingSigState("")
        this.trustLevel = initalState.trustLevel
        this.errorKind = initalState.errorKind
        this.foundGoodSig = initalState.foundGoodSig
    }

    toGpgSignature(): GpgSignature {
        if (this.errorKind != null) {
            return {
                status: Status.Invalid,
                errorKind: this.errorKind
            }
        }
        if (!this.foundGoodSig) {
            return {
                status: Status.Invalid,
                errorKind: ErrorKind.UnrecognizedNonGoodSignature
            }
        }
        if (this.trustLevel != null) {
            return {
                status: Status.Valid,
                trustLevel: this.trustLevel
            }
        }

        throw new Error(
            `gpg output contained GOODSIG but no TRUST_ entry, better not processing that:${EOL}${this.inputForErrorDebugMsg}`
        )
    }

    setErrorKind(errorKind: ErrorKind): void {
        if (
            this.errorKind === null ||
            (this.errorKind === ErrorKind.SigValidationError && errorKind === ErrorKind.UnknownKey)
        ) {
            this.errorKind = errorKind
        } else {
            throw new Error(
                `gpg output contained multiple error signals for same signature, better not processing that:${EOL}${this.inputForErrorDebugMsg}`
            )
        }
    }

    setTrustLevel(trustLevel: TrustLevel): void {
        if (this.trustLevel === null) {
            this.trustLevel = trustLevel
        } else {
            throw new Error(
                `gpg output contained multiple TRUST_* signals for same signature, better not processing that:${EOL}${this.inputForErrorDebugMsg}`
            )
        }
    }

    setFoundGoodSig(): void {
        if (this.foundGoodSig === false) {
            this.foundGoodSig = true
        } else {
            throw new Error(
                `gpg output contained multiple GOODSIG signals for same signature, better not processing that:${EOL}${this.inputForErrorDebugMsg}`
            )
        }
    }
}

/** parses the raw gpg output returned by e.g. git verify-commit --raw */
export function parseRawGpgOutput(gpgStatusLines: string): GpgSignature[] {
    const events = gpgStatusLines
        .split(EOL)
        .filter(string => string.startsWith("[GNUPG:] "))
        .map(string => string.substring(9))

    if (events.length == 0) {
        return []
    }

    const signatures: GpgSignature[] = []

    let state: ParsingSigState | undefined
    const nextState = (): void => {
        if (state != null) {
            const sig = state.toGpgSignature()
            signatures.push(sig)
        }
        state = new ParsingSigState(gpgStatusLines)
    }

    for (const event of events) {
        const type = event.split(" ")[0]

        if (type == "NEWSIG") {
            nextState()
            continue
        }

        if (state !== undefined) {
            if (type.startsWith("TRUST_")) {
                const trustLevel = trustLevelFromString(type.substring(6))
                if (trustLevel === null) {
                    core.debug(`Unrecognized TrustLevel ${trustLevel}`)
                }
                state.setTrustLevel(trustLevel ?? TrustLevel.Unknown)
                continue
            }
            switch (type) {
                case "GOODSIG":
                    state.setFoundGoodSig()
                    break
                case "BADSIG":
                    state.setErrorKind(ErrorKind.BadSignature)
                    break
                case "ERRSIG":
                    state.setErrorKind(ErrorKind.SigValidationError)
                    break
                case "EXPSIG":
                    state.setErrorKind(ErrorKind.ExpiredSignature)
                    break
                case "EXPKEYSIG":
                    state.setErrorKind(ErrorKind.ExpiredKey)
                    break
                case "REVKEYSIG":
                    state.setErrorKind(ErrorKind.RevokedKey)
                    break
                case "NO_PUBKEY":
                    state.setErrorKind(ErrorKind.UnknownKey)
                    break
                default:
                    break
            }
        }
    }

    nextState()

    return signatures
}
