import React from 'react';
import fetch from 'isomorphic-fetch';

import { createCache, createClient } from '@micro-graphql/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MicroGraphQLProvider } from '@micro-graphql/hooks';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Home } from '@micro-graphql/example';

const microClient = createClient({
	fetch,
	cache: createCache(),
	url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
});

const App: React.FC = () => (
	<MicroGraphQLProvider client={microClient}>
		<Home />
	</MicroGraphQLProvider>
);

export default App;
