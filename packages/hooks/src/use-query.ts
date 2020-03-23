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
	clientOnly?: boolean;
	skip?: boolean;
}

export function useQuery<TData, TVariables>(
	query: DocumentNode,
	variables: TVariables | undefined,
	options: IUseQueryOptions = {
		clientOnly: false,
		skip: false,
		skipCache: false
	}
): IUseQueryResult<TData> {
	const client = useClient();
	const [, setRerender] = React.useState<{}>({});
	const initialRenderRef = React.useRef(true);

	const preparedQuery = React.useMemo(() => client.cache.prepareQuery(query), [client, query]);

	const {
		request, skip, skipCache, clientOnly
	} = options;

	initialRenderRef.current = true;
	const dataRef = React.useRef<TData | undefined>(undefined);
	const unsubscribe = React.useMemo(
		() => client.cache.subscribe<TData, TVariables>(
			preparedQuery,
			variables,
			(data) => {
				dataRef.current = data;
				/* istanbul ignore next */
				if (!initialRenderRef.current) {
					setRerender({});
				}
			}
		),
		[client, preparedQuery, variables, setRerender]
	);

	initialRenderRef.current = false;

	React.useEffect(() => unsubscribe, [unsubscribe]);

	const skippedSsr = React.useMemo(
		() => !skip && !!clientOnly && client.ssr,
		[skip, clientOnly, client]
	);

	const promise = React.useMemo(() => {
		if (skip || skippedSsr) {
			return undefined;
		}

		return client.query<TData, TVariables>(query, variables, { skipCache, request });
	}, [query, variables, skip, skippedSsr, skipCache]);

	const [result, error, state] = usePromise(promise, [promise]);

	return {
		...result,
		data: dataRef.current,
		loading: state === UsePromiseState.pending || skippedSsr,
		networkError: error
	};
}
