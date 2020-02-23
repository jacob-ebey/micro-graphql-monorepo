import * as React from 'react';
import { DocumentNode } from 'graphql/language/ast';

import {
	IMicroGraphQLResult,
	IMicroGraphQLQueryOptions
} from '@micro-graphql/core';

import { useClient } from './context';
import { usePromise, UsePromiseState } from './use-promise';

export interface IUseQueryResult<TData> extends IMicroGraphQLResult<TData> {
	loading: boolean;
	networkError?: Error;
}

export interface IUseQueryOptions
	extends IMicroGraphQLQueryOptions {
	skip?: boolean;
}

export function useQuery<TData, TVariables>(
	query: DocumentNode,
	variables: TVariables | undefined,
	options: IUseQueryOptions = {
		skip: false,
		skipCache: false
	}
): IUseQueryResult<TData> {
	const client = useClient();

	const { skip, skipCache } = options;

	const dataRef = React.useRef<TData | undefined>(undefined);
	const unsubscribe = React.useMemo(
		() => client.cache.subscribe<TData, TVariables>(
			query,
			variables,
			(data) => {
				dataRef.current = data;
			}
		),
		[client, query, variables]
	);

	React.useEffect(() => unsubscribe, [unsubscribe]);

	const promise = React.useMemo(() => {
		if (skip) {
			return undefined;
		}

		return client.query<TData, TVariables>(query, variables, { skipCache });
	}, [query, variables, skip, skipCache]);

	const [result, error, state] = usePromise(promise, [promise]);

	return {
		...result,
		data: dataRef.current,
		loading: state === UsePromiseState.pending,
		networkError: error
	};
}