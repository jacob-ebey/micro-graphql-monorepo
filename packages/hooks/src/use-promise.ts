import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

export enum UsePromiseState {
	idle = 'idle',
	pending = 'pending',
	rejected = 'rejected',
	resolved = 'resolved'
}

interface IReducerState<T> {
	error?: Error;
	result?: T;
	state: UsePromiseState;
}

interface IReducerAction<T> {
	type: UsePromiseState;
	payload?: unknown;
}

function reducer<T>(state: IReducerState<T>, action: IReducerAction<T>): IReducerState<T> {
	switch (action.type) {
		/* istanbul ignore next */
		case UsePromiseState.idle:
			return {
				error: undefined,
				result: undefined,
				state: UsePromiseState.idle
			};

		/* istanbul ignore next */
		case UsePromiseState.pending:
			return {
				error: undefined,
				result: undefined,
				state: UsePromiseState.pending
			};

		/* istanbul ignore next */
		case UsePromiseState.resolved:
			return {
				error: undefined,
				result: action.payload as T,
				state: UsePromiseState.resolved
			};

		/* istanbul ignore next */
		case UsePromiseState.rejected:
			return {
				error: action.payload as Error,
				result: undefined,
				state: UsePromiseState.rejected
			};

		/* istanbul ignore next */
		default:
			return state;
	}
}

export type UsePromiseResult<T> = [T | undefined, Error | undefined, UsePromiseState];

export function usePromise<T>(
	promise: Promise<T> | undefined,
	deps: React.DependencyList
): UsePromiseResult<T> {
	const [{ error, result, state }, dispatch] = React.useReducer(reducer, {
		error: undefined,
		result: undefined,
		state: promise ? UsePromiseState.pending : UsePromiseState.idle
	});

	React.useEffect(() => {
		if (!promise) {
			if (state !== UsePromiseState.idle) {
				dispatch({ type: UsePromiseState.idle });
			}

			return noop;
		}

		let canceled = false;

		if (state !== UsePromiseState.pending) {
			dispatch({ type: UsePromiseState.pending });
		}

		promise.then(
			res => !canceled && dispatch({
				payload: res,
				type: UsePromiseState.resolved
			}),
			err => !canceled && dispatch({
				payload: err,
				type: UsePromiseState.rejected
			})
		);

		return (): void => {
			canceled = true;
		};
	}, deps);

	return [result as T | undefined, error, state];
}
