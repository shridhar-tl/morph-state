import React from 'react';
import { ExampleProps } from './types';
import './Playground.scss';

function Playground({ example }: { example: ExampleProps }) {
    return (
        <div className="item-container">
            <div className="item-title">{example.name}</div>
            <div className="item-content">
                <div className="item-code">{example.code}</div>
                <div className="item-divider"></div>
                <div className="item-component">{<example.component />}</div>
            </div>
        </div>
    );
}

export default Playground;