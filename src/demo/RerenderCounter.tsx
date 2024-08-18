import React from "react";

export default function RerenderCounter({ name }: any) {
    const ref = React.useRef<number>(0);
    ref.current += 1;

    return (<div>Component {name} rendered {ref.current} times!</div>);
}