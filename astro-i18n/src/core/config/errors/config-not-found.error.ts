import { CONFIG_NAME } from "@src/constants/meta.constants"

class ConfigNotFound extends Error {
	constructor() {
		super(`Unable to find ${CONFIG_NAME}.`)
	}
}

export default ConfigNotFound
