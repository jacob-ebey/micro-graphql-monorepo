import * as React from 'react';

import { IMicroGraphQLFragment } from '@micro-graphql/core';

export type FFC<P> = React.FC<P> & {
	fragments: {
		[key: string]: IMicroGraphQLFragment;
	};
};
