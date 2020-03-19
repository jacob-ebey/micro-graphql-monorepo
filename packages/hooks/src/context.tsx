import * as React from 'react';
import { DocumentNode } from 'graphql/language/ast';

import {
	IMicroGraphQLClient,
	IMicroGraphQLResult,
	UnsubscribeFunc
} from '@micro-graphql/core';

export const noClientError = 'no client provided, make sure a MicroGraphQLProvider is somewhere up the tree';

export class MicroGraphQLHooksNoClientProvidedError extends Error {}

export const MicroGraphQLContext = React.createContext<IMicroGraphQLClient>({
	async query<TData>(): Promise<IMicroGraphQLResult<TData>> {
		throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
	},
	async mutate<TData>(): Promise<IMicroGraphQLResult<TData>> {
		throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
	},
	async resolveQueries(): Promise<void> {
		throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
	},
	ssr: false,
	cache: {
		prepareQuery(): DocumentNode {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		restore(): void {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		stringify(): string {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		readQuery<T>(): T {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		writeQuery(): void {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		subscribe(): UnsubscribeFunc {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		}
	}
});

export interface IMicroGraphQLProviderProps {
	client: IMicroGraphQLClient;
}

export const MicroGraphQLProvider: React.FC<IMicroGraphQLProviderProps> = ({
	client,
	children
}) => (
	<MicroGraphQLContext.Provider value={client}>
		{children}
	</MicroGraphQLContext.Provider>
);

export function useClient(): IMicroGraphQLClient {
	return React.useContext(MicroGraphQLContext);
}
