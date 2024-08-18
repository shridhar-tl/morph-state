export interface ExampleProps {
    name: string;
    code: string;
    component: React.FunctionComponent;
}

export interface ExampleViewerProps {
    examples: ExampleProps[];
}