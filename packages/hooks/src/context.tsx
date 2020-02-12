import * as React from 'react';

import {
	ITinyGraphQLClient,
	ITinyGraphQLResult,
	ITinyGraphQLSubscriptionOptions,
	queryKeyError,
	TinyGraphQLKeyError
} from '@micro-graphql/core';

export const noClientError = 'no client provided, make sure a TinyGraphQLProvider is somewhere up the tree';

export class TinyGraphQLHooksNoClientProvidedError extends Error {}

export interface IUseQueryResult<TData> extends ITinyGraphQLResult<TData> {
	loading: boolean;
}

export interface ITinyGraphQLContextValue {
	client: ITinyGraphQLClient;
	requestQuery: <TQueryVariables>(
		options: ITinyGraphQLSubscriptionOptions<TQueryVariables>
	) => void;
}

export const TinyGraphQLContext = React.createContext<ITinyGraphQLContextValue>({
	client: {
		hash(): string {
			throw new TinyGraphQLHooksNoClientProvidedError(noClientError);
		},
		async query<TData>(): Promise<ITinyGraphQLResult<TData>> {
			throw new TinyGraphQLHooksNoClientProvidedError(noClientError);
		},
		subscribe(): () => void {
			throw new TinyGraphQLHooksNoClientProvidedError(noClientError);
		},
		async resolveQueries(): Promise<void> {
			throw new TinyGraphQLHooksNoClientProvidedError(noClientError);
		}
	},
	requestQuery(): () => void {
		throw new TinyGraphQLHooksNoClientProvidedError(noClientError);
	}
});

export interface ITinyGraphQLProviderProps {
	client: ITinyGraphQLClient;
}
export const TinyGraphQLProvider: React.FC<ITinyGraphQLProviderProps> = ({
	client,
	children
}) => {
	const queriesRef = React.useRef<{
		[key: string]: boolean;
	}>({});

	const value: ITinyGraphQLContextValue = React.useMemo(() => ({
		client,
		requestQuery<TQueryVariables>(
			options: ITinyGraphQLSubscriptionOptions<TQueryVariables>
		): void {
			const key = client.hash({
				query: options.query,
				variables: options.variables
			});

			if (!key) {
				throw new TinyGraphQLKeyError(queryKeyError);
			}

			let shouldLoad = true;
			if (!Object.prototype.hasOwnProperty.call(queriesRef.current, key)) {
				queriesRef.current[key] = true;
			} else {
				shouldLoad = !queriesRef.current[key];
			}

			if (shouldLoad) {
				queriesRef.current[key] = true;

				const { query, ...queryOptions } = options;
				client.query(query, queryOptions).then().catch().then(() => {
					queriesRef.current[key] = false;
				});
			}
		}
	}), [client]);

	return (
		<TinyGraphQLContext.Provider value={value}>
			{children}
		</TinyGraphQLContext.Provider>
	);
};

export function useClient(): ITinyGraphQLClient {
	const { client } = React.useContext(TinyGraphQLContext);

	return client;
}
