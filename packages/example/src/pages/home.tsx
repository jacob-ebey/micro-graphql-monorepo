import * as React from 'react';

import { gql } from '@micro-graphql/core';
import { useQuery } from '@micro-graphql/hooks';

import { FilmOverview } from '../components/film-overview';
import { FilmSelector } from '../components/film-selector';

const HOME_QUERY = gql`
  query TestQuery($id: ID) {
    film(id: $id) {
      ${FilmOverview.fragments.film}
    }
    allFilms {
      films {
        ${FilmSelector.fragments.films}
      }
    }
  }
`;

export const Home: React.FC = () => {
	const [episodeId, setEpisodeId] = React.useState('ZmlsbXM6MQ==');
	const handleEpisodeChanged = React.useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>): void => {
			event.preventDefault();
			setEpisodeId(`${event.target.value}`);
		},
		[setEpisodeId]
	);

	const { data, errors, loading } = useQuery(React.useMemo(() => ({
		query: HOME_QUERY,
		variables: {
			id: episodeId
		}
	}), [episodeId]));

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
					selected={episodeId}
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
