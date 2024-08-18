import React from "react";
import { createRoot } from "react-dom/client";
import { examples } from "./examples";
import ExampleViewer from "./ExampleViewer";

const rootElement: any = document.getElementById("root");
const root = createRoot(rootElement);
root.render(<ExampleViewer examples={examples} />); 