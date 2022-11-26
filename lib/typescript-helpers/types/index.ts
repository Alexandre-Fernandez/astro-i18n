export type ReplaceProperties<
	Obj1 extends Record<string, unknown>,
	Obj2 extends Record<string, unknown>,
	Obj1ExclusiveKeys extends keyof Omit<Obj1, keyof Obj2> = keyof Omit<
		Obj1,
		keyof Obj2
	>,
> = Remap<
	{
		[key in Obj1ExclusiveKeys]: Obj1[key]
	} & {
		[key in keyof Omit<Obj2, Obj1ExclusiveKeys>]: Obj2[key]
	}
>

type Remap<Obj extends Record<string, unknown>> = {
	[key in keyof Obj]: Obj[key]
}
