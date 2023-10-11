import {
	PACKAGE_NAME,
	REPOSITORY_ISSUES_URL,
} from "@src/constants/meta.constants"

class UnreachableCode extends Error {
	constructor(location?: string) {
		super(
			location
				? `${PACKAGE_NAME}: Unreachable code executed (at "${location}"), please open an issue at "${REPOSITORY_ISSUES_URL}".`
				: `${PACKAGE_NAME}: Unreachable code executed, please open an issue at "${REPOSITORY_ISSUES_URL}".`,
		)
	}
}

export default UnreachableCode
