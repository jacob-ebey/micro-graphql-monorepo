import * as React from 'react';
import { DocumentNode } from 'graphql/language/ast';

import { useClient } from './context';

export type UseClientQueryResult<TData> = [TData, (data: TData) => void];

export function useClientQuery<TData, TVariables>(
	query: DocumentNode,
	variables: TVariables | undefined,
	initialData: TData
): UseClientQueryResult<TData> {
	const client = useClient();
	const [, setRerender] = React.useState<{}>({});

	const preparedQuery = React.useMemo(() => client.cache.prepareQuery(query), [client, query]);

	const firstRenderRef = React.useRef(true);
	if (firstRenderRef.current) {
		firstRenderRef.current = false;

		const data = client.cache.readQuery(preparedQuery, variables);
		if (typeof data === 'undefined' && typeof initialData !== 'undefined') {
			client.cache.writeQuery(preparedQuery, variables, initialData);
		}
	}

	const dataRef = React.useRef<TData>(initialData);
	const initialRenderRef = React.useRef(true);
	initialRenderRef.current = true;
	const unsubscribe = React.useMemo(
		() => client.cache.subscribe<TData, TVariables>(
			preparedQuery,
			variables,
			(data) => {
				dataRef.current = data;
				if (!initialRenderRef.current) {
					setRerender({});
				}
			}
		),
		[client, preparedQuery, variables, setRerender]
	);

	initialRenderRef.current = false;

	React.useEffect(() => unsubscribe, [unsubscribe]);

	const writeQuery = React.useCallback((data: TData): void => {
		client.cache.writeQuery(preparedQuery, variables, data);
	}, [client, preparedQuery, variables]);

	return [dataRef.current, writeQuery];
}
