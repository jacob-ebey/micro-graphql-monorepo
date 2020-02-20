// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';

import { frag } from '@micro-graphql/core';
import { FFC } from '@micro-graphql/hooks';

export interface IFilmOverviewFilm {
	title: string;
	episodeID: number;
	releaseDate: string;
	openingCrawl: string;
}

export interface IFilmOverviewProps {
	film: IFilmOverviewFilm;
}

export const FilmOverview: FFC<IFilmOverviewProps> = ({ film }) => (
	<div>
		<h2>Episode {film.episodeID} | {film.title}</h2>
		<dl>
			<dt>Release date</dt>
			<dd>{film.releaseDate}</dd>
		</dl>
		<blockquote>{film.openingCrawl}</blockquote>
	</div>
);

FilmOverview.fragments = {
	film: frag`
		fragment FilmOverview_film on Film {
			title
			episodeID
			releaseDate
			openingCrawl
		}
	`
};
