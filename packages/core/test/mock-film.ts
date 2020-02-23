// eslint-disable-next-line import/no-extraneous-dependencies
import gql from 'graphql-tag';

export const query = gql`
  query CoreMockFilmQuery($filmID: ID) {
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
