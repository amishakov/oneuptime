import React, { ReactElement } from 'react';
import CompactLoader from './CompactLoader';

const ComponentLoader: () => JSX.Element = (): ReactElement => {
    return (
        <div className="my-16">
            <CompactLoader />
        </div>
    );
};

export default ComponentLoader;
