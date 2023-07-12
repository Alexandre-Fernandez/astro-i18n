import { Regex } from "@lib/regex"

export const NODE_MODULES_SEGMENT_PATTERN = new Regex(/[/\\]?node_modules/)

export const NODE_MODULES_PATH_PATTERN = new Regex(/.+?node_modules/)

export const PACKAGE_DENO_JSON_PATTERN = new Regex(/(?:package|deno)\.json/)
