import * as React from 'react';

import { frag } from '@micro-graphql/core';
import { FFC } from '@micro-graphql/hooks';

export interface IFilmSelectorFilm {
	id: string;
	title: string;
}

export interface IFilmSelectorProps {
	films: IFilmSelectorFilm[];
	selected: string;
	onChange: React.ChangeEventHandler;
}

export const FilmSelector: FFC<IFilmSelectorProps> = ({ films, selected, onChange }) => (
	<select defaultValue={selected} onChange={onChange}>
		{films.map(({ title, id }) => (
			<option key={id} value={id}>{title}</option>
		))}
	</select>
);

FilmSelector.fragments = {
	films: frag`
		fragment FilmSelector_films on Film {
			id
			title
		}
	`
};
