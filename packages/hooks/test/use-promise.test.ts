/* eslint-disable import/no-extraneous-dependencies */
import { act, cleanup, renderHook } from '@testing-library/react-hooks';
import { usePromise } from '../src/use-promise';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (r: any) => any;

class TestPromise {
	public resolvers: Set<unknown>;

	public rejecters: Set<unknown>;

	constructor() {
		this.resolvers = new Set();
		this.rejecters = new Set();
	}

	public then(onResolve: Callback, onReject: Callback): void {
		if (onResolve) {
			this.resolvers.add(onResolve);
		}
		if (onReject) {
			this.rejecters.add(onReject);
		}
	}

	public catch(onReject: Callback): void {
		if (onReject) {
			this.rejecters.add(onReject);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public resolve(result: any): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.resolvers.forEach((resolver: any) => resolver(result));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public reject(error: any): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.rejecters.forEach((rejecter: any) => rejecter(error));
	}
}

describe('use-promise', () => {
	afterEach(cleanup);

	test('should return a `pending` state while the promise is resolving', () => {
		const promise = new TestPromise();
		let state;
		let result;
		let error;

		renderHook(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[result, error, state] = usePromise(promise as any, []);
		});

		expect(result).toBe(undefined);
		expect(error).toBe(undefined);
		expect(state).toBe('pending');
	});

	test('should return the resolved value', () => {
		const promise = new TestPromise();
		let state;
		let result;
		let error;

		renderHook(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[result, error, state] = usePromise(promise as any, []);
		});

		act(() => promise.resolve('foo'));

		expect(state).toBe('resolved');
		expect(result).toBe('foo');
		expect(error).toBe(undefined);
	});

	test('should return the rejected value', () => {
		const promise = new TestPromise();
		let result;
		let state;
		let error;

		renderHook(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[result, error, state] = usePromise(promise as any, []);
		});

		act(() => promise.reject('foo'));

		expect(result).toBe(undefined);
		expect(state).toBe('rejected');
		expect(error).toBe('foo');
	});

	test('should return an undefined result if there is no promise', () => {
		let result;
		let state;

		renderHook(() => {
			[result, , state] = usePromise(undefined, []);
		});

		expect(result).toBe(undefined);
		expect(state).toBe('idle');
	});

	test('should return to the pending state if the inputs change', () => {
		const promise = new TestPromise();
		let inputs = [false];
		let state;

		const { rerender } = renderHook(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[,, state] = usePromise(promise as any, inputs);
		});

		act(() => promise.resolve('foo'));
		expect(state).toBe('resolved');

		inputs = [true];
		rerender();

		expect(state).toBe('pending');
	});

	test('should return to idle state if the inputs change and promise is undefined', () => {
		let promise: TestPromise | undefined = new TestPromise();
		let inputs = [false];
		let state;

		const { rerender } = renderHook(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[,, state] = usePromise(promise as any, inputs);
		});

		act(() => promise!.resolve('foo'));
		expect(state).toBe('resolved');

		inputs = [true];
		promise = undefined;
		rerender();

		expect(state).toBe('idle');
	});
});
