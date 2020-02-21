import {
	normalize,
	denormalize,
	merge,
	NormMap,
	RootFields
} from 'graphql-norm';
// import gql from 'graphql-tag';

import { IMicroGraphQLCache, IMicroGraphQLCacheResult } from '@micro-graphql/core';
import { print, parse as gql } from 'graphql';

import { addRequiredFields } from './helpers';

export function createCache(): IMicroGraphQLCache {
	let cache: NormMap = {};

	return {
		prepareQuery: (query: string): string => {
			const ast = gql(query);

			addRequiredFields(ast);

			return print(ast);
		},
		tryGet: <TValue>(
			query: string,
			variables: { [key: string]: unknown } | undefined
		): IMicroGraphQLCacheResult<TValue> => {
			const { data } = denormalize(gql(query), variables, cache);

			return {
				data: data as TValue,
				success: !!data
			};
		},
		trySet: <TValue>(
			query: string,
			variables: { [key: string]: unknown } | undefined,
			data?: TValue
		): boolean => {
			const normalizedResponse = normalize(gql(query), variables, data as RootFields);
			cache = merge(cache, normalizedResponse);

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
