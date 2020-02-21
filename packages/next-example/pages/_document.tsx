/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Document, {
	Html,
	Head,
	Main,
	NextScript,
	DocumentInitialProps,
	DocumentContext
} from 'next/document';

import { newClient } from '../graphql/client';

class MyDocument extends Document {
	public static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
		const originalRenderPage = ctx.renderPage;

		const microClient = newClient();

		ctx.renderPage({
			enhanceApp: (App) => (props): JSX.Element => (
				<App
					{...{
						...props,
						microClient
					}}
				/>
			)
		});

		await microClient.resolveQueries();

		const microInitialData = microClient.cache.stringify();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ctx.renderPage = (): any => originalRenderPage({
			enhanceApp: (App) => (props): JSX.Element => (
				<App
					{...{
						...props,
						microInitialData
					}}
					pageProps={{
						...props.pageProps,
						microInitialData
					}}
				/>
			)
		});

		const initialProps = await Document.getInitialProps(ctx);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return { ...initialProps, microInitialData } as any;
	}

	// eslint-disable-next-line class-methods-use-this
	public render(): JSX.Element {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { microInitialData } = this.props as any;

		return (
			<Html>
				<Head />
				<body data-micro-ssr={microInitialData}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
