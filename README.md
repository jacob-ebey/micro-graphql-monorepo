# Micro GraphQL [![codecov](https://codecov.io/gh/jacob-ebey/micro-graphql-monorepo/branch/master/graph/badge.svg)](https://codecov.io/gh/jacob-ebey/micro-graphql-monorepo)

## Bundle sizes

- **@micro-graphql/core:** ![npm bundle size](https://img.shields.io/bundlephobia/min/@micro-graphql/core?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@micro-graphql/core?style=flat-square)
- **@micro-graphql/hooks:** ![npm bundle size](https://img.shields.io/bundlephobia/min/@micro-graphql/hooks?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@micro-graphql/hooks?style=flat-square)

## Full examples

- NEXT.JS with SSR and hydration [EXAMPLE](https://github.com/jacob-ebey/micro-graphql-monorepo/tree/master/packages/next-example)
- Create React App [EXAMPLE](https://codesandbox.io/s/github/jacob-ebey/micro-graphql-cra-example/tree/master/)

## React quickstart

Install the required packages:

```shell
> yarn add @micro-graphql/core @micro-graphql/hooks
```

Wrap your app in a client provider and you can use the hooks in any child component.

```jsx
import React from "react";
import { createCache, createClient, objectHash } from "@micro-graphql/core";
import { TinyGraphQLProvider, useQuery } from "@micro-graphql/hooks";

const microClient = createClient({
  fetch,
  cache: createCache(),
  hash: objectHash,
  url: "https://swapi-graphql.netlify.com/.netlify/functions/index"
});

const Home = () => {
  const [episodeId, setEpisodeId] = React.useState("ZmlsbXM6MQ==");
  const handleEpisodeChanged = React.useCallback(
    event => {
      event.preventDefault();
      setEpisodeId(`${event.target.value}`);
    },
    [setEpisodeId]
  );

  const { data, errors, loading } = useQuery(
    React.useMemo(
      () => ({
        query: `
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
        `,
        variables: {
          id: episodeId
        }
      }),
      [episodeId]
    )
  );

  const selector =
    data && data.allFilms && data.allFilms.films ? (
      <select defaultValue={`${episodeId}`} onChange={handleEpisodeChanged}>
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
  <TinyGraphQLProvider client={microClient}>
    <Home />
  </TinyGraphQLProvider>
);

export default App;
```
