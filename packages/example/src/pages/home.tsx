import * as React from 'react';
import gql from 'graphql-tag';
import * as merge from 'deepmerge';

import { useClientQuery, useQuery } from '@micro-graphql/hooks';

import { FilmOverview } from '../components/film-overview';
import { FilmSelector } from '../components/film-selector';

const HOME_QUERY = gql`
  query Home($id: ID) {
    film(id: $id) {
			id
      ...FilmOverview_film
    }
    allFilms {
      films {
				id
        ...FilmSelector_films
      }
    }
  }
	${FilmOverview.fragments.film}
	${FilmSelector.fragments.films}
`;

const HOME_CLIENT_QUERY = gql`
	query HomeClient {
		home {
			selectedEpisode
		}
	}
`;

interface IHomeClientQuery {
	home: {
		__typename: 'Home';
		selectedEpisode: string;
	};
}

export const Home: React.FC = () => {
	const [clientData, setClientData] = useClientQuery<IHomeClientQuery, unknown>(
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
		(event: React.ChangeEvent<HTMLSelectElement>): void => {
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
		HOME_QUERY,
		React.useMemo(() => clientData && ({
			id: clientData.home.selectedEpisode
		}), [clientData]),
		{
			skip: !clientData
		}
	);

	return React.useMemo(() => (
		<section>
			<header>
				<nav>
					<ul>
						<li>
							<h1>MicroGraphQL Example</h1>
						</li>
					</ul>
				</nav>
			</header>

			<article>
				<FilmSelector
					loading={loading}
					films={data && data.allFilms && data.allFilms.films}
					selected={clientData.home.selectedEpisode}
					onChange={handleEpisodeChanged}
				/>

				{errors && (
					<>
						<h2>Errors</h2>
						<pre>
							<code>{JSON.stringify(errors, null, 2)}</code>
						</pre>
					</>
				)}

				{data && data.film ? (
					<FilmOverview film={data.film} />
				) : !loading && (
					<p>Could not find film</p>
				)}
			</article>
		</section>
	), [data, errors, loading]);
};
