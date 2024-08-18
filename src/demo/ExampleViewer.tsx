import React, { useState } from 'react';
import { ExampleProps, ExampleViewerProps } from './types';
import Playground from './Playground';
import './ExampleViewer.scss';

function ExampleViewer({ examples }: ExampleViewerProps) {
    const [selectedExample, setSelectedExample] = useState<ExampleProps>(examples[0]);

    return (
        <div className="example-viewer">
            <h1>Live Examples Viewer</h1>
            <div className="content">
                <div className="sidebar">
                    <ul>
                        {examples.map((example) => (
                            <li
                                key={example.name}
                                className={selectedExample === example ? 'active' : ''}
                                onClick={() => setSelectedExample(example)}
                            >
                                {example.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="playground">
                    <div className="playground-container">
                        <Playground example={selectedExample} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExampleViewer;