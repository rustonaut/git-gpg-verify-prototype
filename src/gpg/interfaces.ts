/** status of the signature either valid or invalid. */
export enum Status {
    /** signature is valid (but might still have TrustLevel.Never!)*/
    Valid,
    /** signature is invalid */
    Invalid
}

/** reason why the signature is invalid */
export enum ErrorKind {
    //Note string assignments are needed for debug-ability of tests or
    // you get errors like expected 1, received 6.
    /** a bad signature (signature verification failed) */
    BadSignature = "BadSignature",
    /** the key used for signing expired */
    ExpiredKey = "ExpiredKey",
    /** the signature expired */
    ExpiredSignature = "ExpiredSignature",
    /** the key ued for signing was revoked */
    RevokedKey = "RevokedKey",
    /** the key used for signing is unknown, trust and validity can not be determined */
    UnknownKey = "UnknownKey",
    /** the validation failed due to some error gpg run into */
    SigValidationError = "SigValidationError",
    /** we couldn't interpret the GPG output and as such treat it as an error */
    UnrecognizedNonGoodSignature = "UnrecognizedNonGoodSignature"
}

/** trust level of the signature */
export enum TrustLevel {
    //Note string assignments are needed for debug-ability of tests or
    // you get errors like expected 1, received 6.
    Never = "Never",
    /** unknown and undefined convey the same degree of trust in different ways */
    Undefined = "Undefined",
    /** marginal and undefined convey the same degree
     *  of trust in different ways */
    Unknown = "Unknown",
    Marginal = "Marginal",
    Full = "Full",
    Ultimate = "Ultimate"
}

/** represents a valid GPG signature */
export interface ValidGpgSignature {
    status: Status.Valid
    trust_level: TrustLevel
}

/** represents a invalid GPG signature (bad, no pubkey, exired, revoked etc.) */
export interface InvalidGpgSignature {
    status: Status.Invalid
    error_kind: ErrorKind
}

/** represents a GPG signature which is either valid or invalid depending on it's status value */
export type GpgSignature = ValidGpgSignature | InvalidGpgSignature
