import * as React from 'react';
import { AppProps } from 'next/app';

import { ITinyGraphQLClient } from '@micro-graphql/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TinyGraphQLProvider } from '@micro-graphql/hooks';

import { newClient } from '../graphql/client';

export interface IMyAppProps extends AppProps {
	microClient?: ITinyGraphQLClient;
	microInitialData?: string;
}

const MyApp: React.FC<IMyAppProps> = ({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	Component,
	pageProps,
	microClient,
	microInitialData
}) => {
	const client = React.useMemo(() => microClient || newClient(), [microClient]);

	if (microInitialData) {
		client.cache.restore(microInitialData);
	}

	return (
		<TinyGraphQLProvider client={client}>
			<Component {...pageProps} />
		</TinyGraphQLProvider>
	);
};

export default MyApp;
