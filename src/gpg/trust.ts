import { TrustLevel } from "./interfaces"

/** Checks if the given trust level is compatible (greater then) the given min trust level
 *
 * A trustLevel of TrustLevel.Never is NEVER trusted, not even if the min trust level is set to Never.
 *
 * Setting the minTrustLevel to Never will cause nothing to be trusted at all not even keys with an
 * Ultimate TrustLevel.
 *
 * Both TrustLevel.Unknown and TrustLevel.Undefined are treated the same wrt. this function.
 */
export function isTrustLevelCompatibleWithMinTrustLevel(
    trustLevel: TrustLevel,
    minTrustLevel: TrustLevel
): boolean {
    return trustLevelOrdRepr(trustLevel) >= trustLevelOrdRepr(minTrustLevel)
}

/** return numbers which can be used to order trust levels based on trust
 *
 * Warning: The returned numbers can arbitrary change between versions of this library,
 *          they are a helper for ordering/comparison NOTHING more.
 *
 * Warning: TrustLevel.Never returns NaN making this unsuitable for many usages
 *          of an ordering indicator. (But ok for the usage this is written for.)
 */
function trustLevelOrdRepr(trustLevel: TrustLevel): number {
    switch (trustLevel) {
        case TrustLevel.Never:
            return NaN
        case TrustLevel.Unknown:
        case TrustLevel.Undefined:
            return 1
        case TrustLevel.Marginal:
            return 2
        case TrustLevel.Full:
            return 3
        case TrustLevel.Ultimate:
            return 4
    }
}
