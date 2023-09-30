import { PACKAGE_NAME } from "@src/constants/meta.constants"

class SerializedStateNotFound extends Error {
	constructor() {
		super(`Could not find the serialized ${PACKAGE_NAME} state in the DOM.`)
	}
}

export default SerializedStateNotFound
