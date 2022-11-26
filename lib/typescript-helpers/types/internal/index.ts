export type ObjectEntry<
	Obj extends Record<PropertyKey, unknown>,
	RequiredObject extends Required<Obj> = Required<Obj>,
> = {
	[key in keyof RequiredObject]: [key, RequiredObject[key]]
}[keyof RequiredObject]
