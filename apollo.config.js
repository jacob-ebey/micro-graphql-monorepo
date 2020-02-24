module.exports = {
  client: {
    service: {
      name: "micro-graphql-monorepo",
      url: "https://swapi-graphql.netlify.com/.netlify/functions/index"
    },
    includes: [
      "./packages/*/src/client-schema.graphql",
      "./packages/*/{src,test}/**/*.ts",
      "./packages/*/{src,test}/**/*.tsx"
    ]
  }
};
