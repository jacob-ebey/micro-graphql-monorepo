import * as React from 'react';
import { NextPage } from 'next';
import fetch from 'isomorphic-fetch';

import {
	createCache,
	createClient,
	objectHash,
	ITinyGraphQLClient
} from '@micro-graphql/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TinyGraphQLProvider } from '@micro-graphql/hooks';

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
		graphqlClient?: ITinyGraphQLClient;
		graphqlData?: string;
	}> = ({ graphqlClient, graphqlData, ...props }) => {
		if (graphqlData) {
			client.cache.restore(graphqlData);
		}

		return (
			<TinyGraphQLProvider client={graphqlClient || client}>
				{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
				<Component {...props as any} />
			</TinyGraphQLProvider>
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
