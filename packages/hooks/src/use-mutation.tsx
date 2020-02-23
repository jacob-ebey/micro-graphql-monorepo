/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { DocumentNode } from 'graphql/language/ast';

import {
	IMicroGraphQLResult
} from '@micro-graphql/core';

import {
	useClient
} from './context';

import { usePromise, UsePromiseState } from './use-promise';

export interface IUseMutationResult<TData> extends IMicroGraphQLResult<TData> {
	loading: boolean;
	networkError?: Error;
}

export type UseMutationResult<TData> = [
	IUseMutationResult<TData>,
	() => void
];

// eslint-disable-next-line max-len
export function useMutation<TData, TVariables>(
	mutation: DocumentNode,
	variables: TVariables | undefined
): UseMutationResult<TData> {
	const client = useClient();

	// eslint-disable-next-line max-len
	const [promise, setPromise] = React.useState<Promise<IMicroGraphQLResult<TData>> | undefined>(undefined);

	const [result, error, state] = usePromise(promise, [promise]);

	const mutate = React.useCallback(() => {
		setPromise(client.mutate(mutation, variables));
	}, [mutation, variables, setPromise]);

	return [
		{
			...result,
			loading: state === UsePromiseState.pending,
			networkError: error
		},
		mutate
	];
}
