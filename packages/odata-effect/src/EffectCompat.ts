import * as BaseEffect from "effect/Effect"

export * from "effect/Effect"

export type Effect<A, E = never, R = never> = BaseEffect.Effect<A, E, R>

export const catchAll = BaseEffect.catch
