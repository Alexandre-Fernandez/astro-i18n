import type { ExecResult } from "@lib/regex"

export type Match = ExecResult

export type Matcher = (string: string) => Match | null
