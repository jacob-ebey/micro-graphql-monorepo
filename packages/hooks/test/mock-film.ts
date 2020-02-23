// eslint-disable-next-line import/no-extraneous-dependencies
import gql from 'graphql-tag';

export const query = gql`
  query HooksMockFilmQuery($filmID: ID) {
    film(filmID: $filmID) {
      id
      title
      episodeID
    }
  }
`;

export const variables = { filmID: 1 };

export const response = `
{
  "data": {
    "film": {
      "__typename": "Film",
      "id": "ZmlsbXM6MQ==",
      "title": "A New Hope",
      "episodeID": 4
    }
  }
}
`;

export const errorResponse = `
{
  "errors": [
    {
      "message": "No entry in local cache for https://swapi.co/api/films/32/",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": [
        "film"
      ]
    }
  ],
  "data": {
    "film": null
  }
}
`;
