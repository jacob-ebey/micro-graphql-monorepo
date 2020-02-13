import * as React from 'react';
import { NextPage } from 'next';
import fetch from 'isomorphic-fetch';

import {
	createCache,
	createClient,
	objectHash,
	IMicroGraphQLClient
} from '@micro-graphql/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MicroGraphQLProvider } from '@micro-graphql/hooks';

export default function withMicroGraphQL<TProps extends {}>(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	Component: NextPage<TProps>,
	{ ssr } = { ssr: true }
): React.FC<TProps> {
	const client = createClient({
		ssr,
		fetch,
		cache: createCache(),
		hash: objectHash,
		url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
	});

	const res: NextPage<TProps & {
		graphqlClient?: IMicroGraphQLClient;
		graphqlData?: string;
	}> = ({ graphqlClient, graphqlData, ...props }) => {
		if (graphqlData) {
			client.cache.restore(graphqlData);
		}

		return (
			<MicroGraphQLProvider client={graphqlClient || client}>
				{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
				<Component {...props as any} />
			</MicroGraphQLProvider>
		);
	};

	if (ssr || Component.getInitialProps) {
		res.getInitialProps = async (ctx): Promise<TProps> => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { AppTree } = ctx;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let pageProps: any = {};
			if (Component.getInitialProps) {
				pageProps = await Promise.resolve(Component.getInitialProps(ctx));
			}

			// eslint-disable-next-line global-require
			const render = require('react-dom/server').renderToStaticMarkup;

			render(<AppTree graphqlClient={client} {...pageProps} />);

			await client.resolveQueries();

			const graphqlData = client.cache.stringify();

			return {
				...pageProps,
				graphqlData
			};
		};
	} else {
		res.getInitialProps = Component.getInitialProps;
	}

	return res;
}
