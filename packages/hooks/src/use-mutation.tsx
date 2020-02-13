import * as React from 'react';

import {
	IMicroGraphQLSubscriptionOptions
} from '@micro-graphql/core';

import {
	MicroGraphQLContext,
	IUseQueryResult
} from './context';

import { IUseQueryOptions, useQuery } from './use-query';

export type UseMutationResult<TData, TQueryVariables> = [
	IUseQueryResult<TData>,
	() => void
];

export function useMutation<TData, TQueryVariables>(
	options: IMicroGraphQLSubscriptionOptions<TQueryVariables>
): UseMutationResult<TData, TQueryVariables> {
	const { requestQuery } = React.useContext(MicroGraphQLContext);

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
