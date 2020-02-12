export interface ITinyGraphQLCacheResult<TValue> {
	data?: TValue;
	success: boolean;
}

export interface ITinyGraphQLCache {
	tryGet<TValue>(key: string): ITinyGraphQLCacheResult<TValue>;
	trySet<TValue>(key: string, data?: TValue): boolean;
	stringify(): string;
	restore(data: string): void;
}

export function createCache(): ITinyGraphQLCache {
	let cache: { [key: string]: unknown } = {};

	return {
		tryGet: <TValue>(key: string): ITinyGraphQLCacheResult<TValue> => {
			const success = key in cache;
			const data = success ? cache[key] : undefined;

			return {
				data: data as TValue,
				success
			};
		},
		trySet: <TValue>(key: string, data?: TValue): boolean => {
			cache[key] = data;

			return false;
		},
		stringify(): string {
			return JSON.stringify(cache);
		},
		restore(data: string): void {
			cache = JSON.parse(data);
		}
	};
}
