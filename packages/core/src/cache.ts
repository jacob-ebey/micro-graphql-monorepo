import { DocumentNode } from 'graphql/language/ast';
import {
	normalize,
	denormalize,
	merge,
	Variables
} from 'graphql-norm';

import { addRequiredFields } from './helpers';

export type SubscribeCallback<TData> = (data: TData) => void;
export type UnsubscribeFunc = () => void;

export interface IMicroGraphQLCache {
	readQuery<TData, TVariables>(
		query: DocumentNode,
		variables?: TVariables
	): TData | undefined;

	writeQuery<TData, TVariables>(
		query: DocumentNode,
		variables: TVariables | undefined,
		data: TData
	): void;

	subscribe<TData, TVariables>(
		query: DocumentNode,
		variables: TVariables | undefined,
		callback: SubscribeCallback<TData>
	): UnsubscribeFunc;

	prepareQuery(query: DocumentNode): DocumentNode;

	stringify(): string;

	restore(data: string): void;
}

type SubscriptionArr = Array<{
	callback: SubscribeCallback<unknown>;
	triggers: string[];
	query: DocumentNode;
	variables: unknown;
}>;

export function createCache(): IMicroGraphQLCache {
	let cache = {};
	let subscriptions: SubscriptionArr = [];

	function notifySubscribers(triggers: string[]): void {
		subscriptions.forEach(s => {
			if (s.triggers.length < 2
				|| s.triggers.slice(1).some(trigger => triggers.some(t => t === trigger))
			) {
				const { data, fields } = denormalize(s.query, s.variables as Variables, cache);

				s.triggers = Object.getOwnPropertyNames(fields);

				if (data) {
					s.callback(data);
				}
			}
		});
	}

	return {
		stringify(): string {
			return JSON.stringify(cache);
		},

		restore(data: string): void {
			cache = JSON.parse(data) || {};
		},

		prepareQuery(query: DocumentNode): DocumentNode {
			return addRequiredFields(query);
		},

		readQuery<TData, TVariables>(
			query: DocumentNode,
			variables?: TVariables
		): TData | undefined {
			const { data } = denormalize(query, variables, cache);

			return data as TData | undefined;
		},

		writeQuery<TData, TVariables>(
			query: DocumentNode,
			variables: TVariables | undefined,
			data: TData
		): void {
			const normalizedData = normalize(query, variables, data);
			cache = merge(cache, normalizedData);

			notifySubscribers(Object.getOwnPropertyNames(normalizedData));
		},

		subscribe<TData, TVariables>(
			query: DocumentNode,
			variables: TVariables | undefined,
			callback: SubscribeCallback<TData>
		): UnsubscribeFunc {
			const { data, fields } = denormalize(query, variables, cache);

			if (typeof data !== 'undefined') {
				callback(data as TData);
			}

			subscriptions.push({
				callback: callback as SubscribeCallback<unknown>,
				triggers: Object.getOwnPropertyNames(fields),
				query,
				variables
			});

			return (): void => {
				subscriptions = subscriptions.filter(s => s.callback !== callback);
			};
		}
	};
}
