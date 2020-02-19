import { frag, gql, noFragmentNameError } from '../src';

describe('gql', () => {
	it('should support no fragments', () => {
		const tag = gql`
			query TestQuery($id: ID) {
				film(filmID: $id) {
					title
				}
			}
		`;

		expect(tag).toBe(`query TestQuery($id: ID) {
				film(filmID: $id) {
					title
				}
			}`);
	});

	it('throws if no fragment name', () => {
		expect(() => frag`
			fragment on Film {
				id
			}
		`).toThrow(noFragmentNameError);
	});

	it('can parse fragment', () => {
		const fragTag = frag`
			fragment FilmInfo on Film {
				id
			}
		`;

		expect(fragTag.name).toBe('FilmInfo');
		expect(fragTag.definition).toBe(`fragment FilmInfo on Film {
				id
			}`);
	});

	it('should support single fragment', () => {
		const fragTag = frag`
			fragment FilmInfo on Film {
				id
			}
		`;

		const tag = gql`
			query TestQuery($id: ID) {
				film(filmID: $id) {
					title
					${fragTag}
				}
			}
		`;

		expect(tag).toBe(`query TestQuery($id: ID) {
				film(filmID: $id) {
					title
					...FilmInfo
				}
			}
fragment FilmInfo on Film {
				id
			}`);
	});

	it('should support multiple fragment', () => {
		const fragTag1 = frag`
			fragment FilmInfo on Film {
				id
			}
		`;

		const fragTag2 = frag`
			fragment FilmDetails on Film {
				id
				episodeID
			}
		`;

		const tag = gql`
			query TestQuery($id: ID) {
				film(filmID: $id) {
					title
					${fragTag1}
					${fragTag2}
				}
			}
		`;

		expect(tag).toBe(`query TestQuery($id: ID) {
				film(filmID: $id) {
					title
					...FilmInfo
					...FilmDetails
				}
			}
fragment FilmInfo on Film {
				id
			}
fragment FilmDetails on Film {
				id
				episodeID
			}`);
	});
});
