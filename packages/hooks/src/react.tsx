import * as React from 'react';
import { DocumentNode } from 'graphql/language/ast';

export type FFC<P> = React.FC<P> & {
	fragments: {
		[key: string]: DocumentNode;
	};
};
