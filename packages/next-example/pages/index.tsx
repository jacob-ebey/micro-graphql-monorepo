import * as React from 'react';

import { useQuery } from '@micro-graphql/hooks';

const Home: React.FC = () => {
	const [episodeId, setEpisodeId] = React.useState('ZmlsbXM6MQ==');
	const handleEpisodeChanged = (event): void => {
		event.preventDefault();
		setEpisodeId(`${event.target.value}`);
	};

	const { data, errors, loading } = useQuery(React.useMemo(() => ({
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
	}), [episodeId]));

	const selector = data && data.allFilms && data.allFilms.films ? (
		<select defaultValue={`${episodeId}`} onChange={handleEpisodeChanged}>
			{data.allFilms.films.map(({ title, id }) => (
				<option key={id} value={`${id}`}>{title || id}</option>
			))}
		</select>
	) : null;

	if (loading) {
		return (
			<>
				{selector}
				<h1>Loading........</h1>
			</>
		);
	}

	if (errors) {
		return (
			<>
				{selector}
				<h1>Errors...</h1>
				<pre>
					<code>{JSON.stringify(errors, null, 2)}</code>
				</pre>
			</>
		);
	}

	return (
		<>
			{selector}
			<h1>Data!!!</h1>
			<pre>
				<code>{JSON.stringify(data, null, 2)}</code>
			</pre>
		</>
	);
};

export default Home;
