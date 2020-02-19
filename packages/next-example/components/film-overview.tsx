// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';

import { frag } from '@micro-graphql/core';
import { FFC } from '@micro-graphql/hooks';

export interface IFilmOverviewFilm {
	title: string;
	episodeID: number;
	releaseDate: string;
}

export interface IFilmOverviewProps {
	film: IFilmOverviewFilm;
}

const FilmOverview: FFC<IFilmOverviewProps> = ({ film }) => (
	<div>
		<p>Episode {film.episodeID} | {film.title}</p>
	</div>
);

FilmOverview.fragments = {
	film: frag`
		fragment FilmOverview_film on Film {
			title
			episodeID
			releaseDate
		}
	`
};

export default FilmOverview;
