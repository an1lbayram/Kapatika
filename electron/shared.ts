export type ShutdownPlan = {
  totalSeconds: number
  preWaitSeconds: number
  shutdownTSeconds: number
}

export type ShutdownState =
  | { kind: 'idle' }
  | { kind: 'prewait'; endsAtEpochMs: number; totalSeconds: number }
  | { kind: 'scheduled'; shutdownTSeconds: number }

export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: string }

