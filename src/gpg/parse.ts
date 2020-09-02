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
    input_for_error_debug_msg: string
    trustLevel: TrustLevel | null
    errorKind: ErrorKind | null
    foundGoodsign: boolean

    constructor(input_for_error_debug_msg: string) {
        this.trustLevel = null
        this.errorKind = null
        this.foundGoodsign = false
        this.input_for_error_debug_msg = input_for_error_debug_msg
    }

    reset(): void {
        const initalState = new ParsingSigState("")
        this.trustLevel = initalState.trustLevel
        this.errorKind = initalState.errorKind
        this.foundGoodsign = initalState.foundGoodsign
    }

    toGpgSignature(): GpgSignature {
        if (this.errorKind != null) {
            return {
                status: Status.Invalid,
                error_kind: this.errorKind
            }
        }
        if (!this.foundGoodsign) {
            return {
                status: Status.Invalid,
                error_kind: ErrorKind.UnrecognizedNonGoodSignature
            }
        }
        if (this.trustLevel != null) {
            return {
                status: Status.Valid,
                trust_level: this.trustLevel
            }
        }

        throw new Error(
            `gpg output contained GOODSIG but no TRUST_ entry, better not processing that:${EOL}${this.input_for_error_debug_msg}`
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
                `gpg output contained multiple error signals for same signature, better not processing that:${EOL}${this.input_for_error_debug_msg}`
            )
        }
    }

    setTrustLevel(trustLevel: TrustLevel): void {
        if (this.trustLevel === null) {
            this.trustLevel = trustLevel
        } else {
            throw new Error(
                `gpg output contained multiple TRUST_* signals for same signature, better not processing that:${EOL}${this.input_for_error_debug_msg}`
            )
        }
    }

    setFoundGoodSig(): void {
        if (this.foundGoodsign === false) {
            this.foundGoodsign = true
        } else {
            throw new Error(
                `gpg output contained multiple GOODSIG signals for same signature, better not processing that:${EOL}${this.input_for_error_debug_msg}`
            )
        }
    }
}

/** parses the raw gpg output returned by e.g. git verify-commit --raw */
export function parseRawGpgOutput(gpg_status_lines: string): GpgSignature[] {
    const events = gpg_status_lines
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
        state = new ParsingSigState(gpg_status_lines)
    }

    for (const event of events) {
        const type = event.split(" ")[0]

        if (type == "NEWSIG") {
            nextState()
            continue
        }

        if (state !== undefined) {
            if (type.startsWith("TRUST_")) {
                const trust_level = trustLevelFromString(type.substring(6))
                if (trust_level === null) {
                    console.debug("Unrecognized TrustLevel", trust_level)
                }
                state.setTrustLevel(trust_level ?? TrustLevel.Unknown)
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
