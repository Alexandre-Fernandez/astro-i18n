class CannotRedirect extends Error {
	constructor() {
		super("Could not redirect, is this code running in the server ?")
	}
}

export default CannotRedirect
