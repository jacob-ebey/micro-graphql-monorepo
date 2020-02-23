import * as React from 'react';
import gql from 'graphql-tag';

import { FFC } from '@micro-graphql/hooks';

export interface IFilmSelectorFilm {
	id: string;
	title: string;
}

export interface IFilmSelectorProps {
	loading?: boolean;
	films?: IFilmSelectorFilm[];
	selected: string;
	onChange: React.ChangeEventHandler;
}

export const FilmSelector: FFC<IFilmSelectorProps> = ({
	loading,
	films,
	selected,
	onChange
// eslint-disable-next-line no-nested-ternary
}) => {
	const loadingRes = React.useMemo(() => (loading ? <code>Loading...</code> : null), [loading]);

	if (!films) {
		return loadingRes;
	}

	return (
		<fieldset>
			<label htmlFor="film-picker">Pick a film {loadingRes}</label>
			<select id="film-picker" defaultValue={selected} onChange={onChange}>
				{films.map(({ title, id }) => (
					<option key={id} value={id}>{title}</option>
				))}
			</select>
		</fieldset>
	);
};

FilmSelector.fragments = {
	films: gql`
		fragment FilmSelector_films on Film {
			id
			title
		}
	`
};
