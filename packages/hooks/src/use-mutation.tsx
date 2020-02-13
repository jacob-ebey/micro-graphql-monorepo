import * as React from 'react';

import {
	ITinyGraphQLSubscriptionOptions
} from '@micro-graphql/core';

import {
	TinyGraphQLContext,
	IUseQueryResult
} from './context';

import { IUseQueryOptions, useQuery } from './use-query';

export type UseMutationResult<TData, TQueryVariables> = [
	IUseQueryResult<TData>,
	() => void
];

export function useMutation<TData, TQueryVariables>(
	options: ITinyGraphQLSubscriptionOptions<TQueryVariables>
): UseMutationResult<TData, TQueryVariables> {
	const { requestQuery } = React.useContext(TinyGraphQLContext);

	const resultOptions = React.useMemo<IUseQueryOptions<TQueryVariables>>(() => ({
		query: options.query,
		variables: options.variables,
		skip: true
	}), [options]);

	const result = useQuery<TData, TQueryVariables>(resultOptions);

	const mutate = React.useCallback(() => requestQuery({
		query: options.query,
		skipCache: true,
		variables: options.variables
	}), [requestQuery, options]);

	return [result, mutate];
}
