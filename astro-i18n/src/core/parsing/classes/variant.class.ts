// original maps translation.key to array of variants

// make computed translations as such

/*
{
	"my.translation.key": {
		default: "Hello I'm a default translation.",
		variants: [
			Variant
		]
	}
}
*/

class Variant {
	raw = "key{{ prop1: 'test', prop2: 3 }}"

	key = "key"

	value = "Hello I'm a translation." // interpolations not resolved

	priority = 1

	properties = [
		{ name: "prop1", value: "test" },
		{ name: "prop2", value: 3 },
	]

	constructor(
		key: string,
		value: string,
		properties: Record<string, unknown>,
	) {
		this.value = value
	}
}

export default Variant
