import React from 'react';

import { createCache, createClient, objectHash } from "@micro-graphql/core";
import { MicroGraphQLProvider } from "@micro-graphql/hooks";

import Home from './pages/home';

const microClient = createClient({
  fetch,
  cache: createCache(),
  hash: objectHash,
  url: "https://swapi-graphql.netlify.com/.netlify/functions/index"
});

const App = () => (
  <MicroGraphQLProvider client={microClient}>
    <Home />
  </MicroGraphQLProvider>
);

export default App;
