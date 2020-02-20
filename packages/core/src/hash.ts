export function sortObjectKeys<T extends { [key: string]: unknown }>(object: T): T {
	const objectKeys = Object.keys(object);

	return ([] as string[]).concat(objectKeys.sort()).reduce((total, key) => {
		total[key] = object[key];
		return total;
	}, Object.create(null));
}

export type ObjectHasher = (
	obj?: null | { [key: string]: unknown }
) => string | null;

export function objectHash(obj: { [key: string]: unknown }): string {
	const sorted: unknown = sortObjectKeys(obj);
	const json = JSON.stringify(sorted);

	// removes whitespace
	return json.replace(/\s+/g, '');
}
