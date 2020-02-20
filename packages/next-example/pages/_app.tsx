import * as React from 'react';
import { AppProps } from 'next/app';
import 'tacit-css/dist/tacit-css-1.5.1.min.css';

import { IMicroGraphQLClient } from '@micro-graphql/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MicroGraphQLProvider } from '@micro-graphql/hooks';

import { newClient } from '../graphql/client';

export interface IMyAppProps extends AppProps {
	microClient?: IMicroGraphQLClient;
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
		<MicroGraphQLProvider client={client}>
			<Component {...pageProps} />
		</MicroGraphQLProvider>
	);
};

export default MyApp;
