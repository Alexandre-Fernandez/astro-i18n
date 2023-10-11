import { Regex } from "@lib/regex"

export const ROUTE_PARAM_PATTERN = new Regex(/\[(\.{3})?([\w-]+)]/)

export const URL_PATTERN = new Regex(
	/(?:https?:\/{2})?[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b[\w#%&()+./:=?@~-]*/,
)
