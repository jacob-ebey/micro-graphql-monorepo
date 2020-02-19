export function gql(strings: TemplateStringsArray, ...fragments: IMicroGraphQLFragment[]): string {
	const frags = fragments.map(fragment => fragment.definition).join('\n').trim();

	return strings.map((str, i) => {
		const cat = fragments[i] ? `...${fragments[i].name}` : '';
		return str + cat;
	}).join('').trim() + (frags ? `\n${frags}` : '');
}

export interface IMicroGraphQLFragment {
	definition: string;
	name: string;
}

export const noFragmentNameError = 'no name found for the provided fragment';

export function frag(
	strings: TemplateStringsArray
): IMicroGraphQLFragment {
	const definition = gql(strings);

	const name = definition.match(/fragment\s([A-z][\w\d]*)\son/);

	if (!name || !name[1]) {
		throw new Error(noFragmentNameError);
	}

	return {
		definition,
		name: name[1]
	};
}
