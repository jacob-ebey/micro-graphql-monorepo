# Micro GraphQL [![codecov](https://codecov.io/gh/jacob-ebey/micro-graphql-monorepo/branch/master/graph/badge.svg)](https://codecov.io/gh/jacob-ebey/micro-graphql-monorepo)

A tiny, simple to use GraphQL client with SSR support.

## Bundle sizes

- **@micro-graphql/core:** ![npm bundle size](https://img.shields.io/bundlephobia/min/@micro-graphql/core?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@micro-graphql/core?style=flat-square)
- **@micro-graphql/hooks:** ![npm bundle size](https://img.shields.io/bundlephobia/min/@micro-graphql/hooks?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@micro-graphql/hooks?style=flat-square)

## Full examples

- NEXT.js with SSR and hydration [EXAMPLE](https://github.com/jacob-ebey/micro-graphql-monorepo/tree/master/packages/next-example)
- Create React App [EXAMPLE](https://github.com/jacob-ebey/micro-graphql-monorepo/tree/master/packages/cra-example), [PLAYGROUND](https://codesandbox.io/s/github/jacob-ebey/micro-graphql-monorepo/tree/master/packages/cra-example)

## Overview

### useQuery

```jsx
const { data, errors, loading } = useQuery(
  React.useMemo(
    () => ({
      query: YOUR_QUERY,
      variables: {
        example: variable
      }
    }),
    [variable]
  )
);
```

### useMutation

```jsx
const [{ data, errors, loading }, mutate] = useMutation(
  React.useMemo(
    () => ({
      query: YOUR_MUTATION,
      variables: {
        example: variable
      }
    }),
    [variable]
  )
);

return <button onClick={mutate}>Run mutation</button>;
```

## React quickstart

Install the required packages:

```shell
> yarn add @micro-graphql/core @micro-graphql/hooks
```

Wrap your app in a client provider and you can use the hooks in any child component.

```jsx
import React from 'react';
import gql from 'graphql-tag';
import { createCache, createClient } from '@micro-graphql/core';
import { MicroGraphQLProvider, useQuery } from '@micro-graphql/hooks';
import merge from 'deepmerge';

const microClient = createClient({
  fetch,
  cache: createCache(),
  url: "https://swapi-graphql.netlify.com/.netlify/functions/index"
});

const HOME_QUERY = gql`
  query TestQuery($id: ID) {
    film(id: $id) {
      id
      title
    }
    allFilms {
      films {
        id
        title
      }
    }
  }
`;

const Home = () => {
  const [clientData, setClientData] = useClientQuery(
    HOME_CLIENT_QUERY,
    undefined,
    {
      home: {
        __typename: 'Home',
        selectedEpisode: 'ZmlsbXM6MQ=='
      }
    }
  );

  const handleEpisodeChanged = React.useCallback(
    (event) => {
      event.preventDefault();

      setClientData(
        merge(clientData, {
          home: {
            selectedEpisode: event.target.value
          }
        })
      );
    },
    [clientData, setClientData]
  );

  const { data, errors, loading } = useQuery(
    HOME_QUERY
    React.useMemo(
      () => ({
        id: clientData.home.selectedEpisode
      }),
      [clientData]
    )
  );

  const selector =
    data && data.allFilms && data.allFilms.films ? (
      <select defaultValue={`${clientData.home.selectedEpisode}`} onChange={handleEpisodeChanged}>
        {data.allFilms.films.map(({ title, id }) => (
          <option key={id} value={`${id}`}>
            {title || id}
          </option>
        ))}
      </select>
    ) : null;

  if (loading) {
    return (
      <React.Fragment>
        {selector}
        <h1>Loading........</h1>
      </React.Fragment>
    );
  }

  if (errors) {
    return (
      <React.Fragment>
        {selector}
        <h1>Errors...</h1>
        <pre>
          <code>{JSON.stringify(errors, null, 2)}</code>
        </pre>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {selector}
      <h1>Data!!!</h1>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </React.Fragment>
  );
};

const App = () => (
  <MicroGraphQLProvider client={microClient}>
    <Home />
  </MicroGraphQLProvider>
);

export default App;
```

## Contributors

The release process is currently manual and is done by running:

```bash
> yarn pub
```

This will build, version, tag and publish the packages to npm.
