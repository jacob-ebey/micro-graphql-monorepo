/* eslint-disable import/extensions */
import { objectHash, sortObjectKeys } from '../src/hash';

describe('hash', () => {
	describe('sortObjectKeys', () => {
		it('sorts keys', () => {
			const input = {
				z: 'z',
				y: 'y',
				x: 'x'
			};

			expect(Object.keys(sortObjectKeys(input))).toEqual(['x', 'y', 'z']);
		});
	});

	describe('objectHash', () => {
		it('hashes object reliably', () => {
			const input = {
				z: 'z',
				y: 'y',
				x: 'x',
				a: undefined,
				b: null,
				c: false,
				d: true,
				e: 1,
				f: 2.2,
				g: {
					z: 'z',
					y: 'y',
					x: 'x'
				}
			};
			const snapshot = '"{\\"b\\":null,\\"c\\":false,\\"d\\":true,\\"e\\":1,\\"f\\":2.2,\\"g\\":{\\"z\\":\\"z\\",\\"y\\":\\"y\\",\\"x\\":\\"x\\"},\\"x\\":\\"x\\",\\"y\\":\\"y\\",\\"z\\":\\"z\\"}"';

			for (let i = 0; i < 1000; i += 1) {
				const hash = objectHash(input);
				expect(hash).toMatchInlineSnapshot(snapshot);
			}
		});
	});
});
