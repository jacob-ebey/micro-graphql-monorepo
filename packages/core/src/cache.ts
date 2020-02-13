export interface IMicroGraphQLCacheResult<TValue> {
	data?: TValue;
	success: boolean;
}

export interface IMicroGraphQLCache {
	tryGet<TValue>(key: string): IMicroGraphQLCacheResult<TValue>;
	trySet<TValue>(key: string, data?: TValue): boolean;
	stringify(): string;
	restore(data: string): void;
}

export function createCache(): IMicroGraphQLCache {
	let cache: { [key: string]: unknown } = {};

	return {
		tryGet: <TValue>(key: string): IMicroGraphQLCacheResult<TValue> => {
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
