/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { DocumentNode } from 'graphql/language/ast';

import {
	IMicroGraphQLMutationOptions,
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

export type UseMutationResult<TData, TVariables> = [
	IUseMutationResult<TData>,
	(variables?: TVariables) => void
];

// eslint-disable-next-line max-len
export function useMutation<TData, TVariables>(
	mutation: DocumentNode,
	variables: TVariables | undefined,
	options: IMicroGraphQLMutationOptions = {}
): UseMutationResult<TData, TVariables> {
	const client = useClient();

	// eslint-disable-next-line max-len
	const [promise, setPromise] = React.useState<Promise<IMicroGraphQLResult<TData>> | undefined>(undefined);

	const [result, error, state] = usePromise(promise, [promise]);

	const mutate = React.useCallback((mutateVariables?: TVariables) => {
		setPromise(client.mutate(mutation, { ...variables, ...mutateVariables }, options));
	}, [mutation, variables, setPromise, options]);

	return [
		{
			...result,
			loading: state === UsePromiseState.pending,
			errors: ((result && result.errors) || error) ? [...(error ? [{
				message: error.message
			}] : []), ...((result && result.errors) || [])] : undefined,
			networkError: error
		},
		mutate
	];
}
