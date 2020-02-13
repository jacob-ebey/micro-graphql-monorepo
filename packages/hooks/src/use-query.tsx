import * as React from 'react';

import {
	ITinyGraphQLSubscriptionOptions
} from '@micro-graphql/core';

import {
	IUseQueryResult,
	TinyGraphQLContext
} from './context';

export interface IUseQueryOptions<TVariables>
	extends ITinyGraphQLSubscriptionOptions<TVariables> {
	skip?: boolean;
}


// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

export function useQuery<TData, TQueryVariables>(
	options: IUseQueryOptions<TQueryVariables>
): IUseQueryResult<TData> {
	const { client, requestQuery } = React.useContext(TinyGraphQLContext);

	const firstRender = React.useRef<boolean>(true);
	const resultRef = React.useRef<IUseQueryResult<TData>>({
		loading: !options.skip
	});

	const [skip, subscriptionOptions] = React.useMemo(() => {
		const { skip: s, ...rest } = options;

		return [s, rest];
	}, [options]);

	const [, updateState] = React.useState();
	const forceUpdate = React.useCallback(() => updateState({}), []);

	const unsubscribe = React.useMemo(
		() => client.subscribe<TData, TQueryVariables>(
			subscriptionOptions,
			(result: IUseQueryResult<TData>) => {
				resultRef.current = {
					...resultRef.current,
					...result
				};
				if (!firstRender.current && !client.ssr) {
					forceUpdate();
				}
				firstRender.current = false;
			}
		),
		[client, firstRender, subscriptionOptions]
	);

	const unsubscribeFunc: any = client.ssr ? unsubscribe() : unsubscribe;
	React.useEffect(
		(): (() => void) => unsubscribeFunc,
		[unsubscribeFunc]
	);

	const query = React.useMemo(() => (): void => {
		if (skip) {
			return;
		}

		requestQuery(subscriptionOptions);
	}, [skip, subscriptionOptions]);

	const queryFunc = client.ssr ? (query() as undefined || noop) : query;

	React.useEffect(queryFunc, [skip, subscriptionOptions]);

	return resultRef.current;
}
