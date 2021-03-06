/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentNode } from 'graphql/language/ast';
import { Kind } from 'graphql/language/kinds';
import { visit } from 'graphql/language/visitor';

const isInlineFragment = (node: any): boolean => node.kind === Kind.INLINE_FRAGMENT;

const hasField = (fieldName: any) => (set: any): any => set.some(({
	alias, name
}: any) => (alias || name).value === fieldName);

const createField = (name: string): any => ({
	kind: 'Field',
	alias: undefined,
	name: {
		kind: 'Name',
		value: name
	},
	arguments: [],
	directives: [],
	selectionSet: undefined
});

const hasTypeNameField = hasField('__typename');
const hasEdgesField = hasField('edges');
const typeNameField = createField('__typename');

const connectionFields = ['edges', 'pageInfo'];

const excludeMetaFields = (node: any, _: any, parent: any): any => node.selections
	.some(isInlineFragment)
	|| hasEdgesField(node.selections)
	|| (!isInlineFragment(parent) && connectionFields.includes(parent.name.value));

export function addRequiredFields(query: DocumentNode): DocumentNode {
	return visit(query, {
		SelectionSet: (node, key, parent: any): any => {
			if (parent
				&& (parent.kind === Kind.OPERATION_DEFINITION || excludeMetaFields(node, key, parent))) {
				return undefined;
			}

			if (!hasTypeNameField(node.selections)) {
				(node.selections as any).unshift(typeNameField);
			}

			return node;
		}
	});
}
