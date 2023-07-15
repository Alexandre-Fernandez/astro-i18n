/*
type ConfigTranslations = {
	[namespace: string]: {
		[locale: string]: DeepStringRecord
	}
	$load?: {
		namespaces: string[]
		routes: string[]
	}[]
} 

computed translations :
{
	"my.translation.key": {
		default: "Hello I'm a default translation.",
		variants: [
			Variant
		]
	}
}


{
	common: { load in all pages }
	"/page": { load in /page }
}

*/

class TranslationDictionary {
	static fromConfig() {
		//
	}
}

export default TranslationDictionary
