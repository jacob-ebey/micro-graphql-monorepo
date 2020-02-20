import React from 'react';
import fetch from 'isomorphic-fetch';

import { createCache, createClient, objectHash } from '@micro-graphql/core';
import { MicroGraphQLProvider } from '@micro-graphql/hooks';
import { Home } from '@micro-graphql/example';

const microClient = createClient({
	fetch,
	cache: createCache(),
	hash: objectHash,
	url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
});

const App: React.FC = () => (
	<MicroGraphQLProvider client={microClient}>
		<Home />
	</MicroGraphQLProvider>
);

export default App;
