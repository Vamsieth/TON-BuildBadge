"use client";

import { useState } from "react";

interface CodeBlockProps {
    code: string;
    language?: string;
    initialLines?: number;
}

export default function CodeBlock({ code, language = "tolk", initialLines = 20 }: CodeBlockProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const lines = code.split("\n");
    const displayLines = isExpanded ? lines : lines.slice(0, initialLines);
    const hiddenCount = lines.length - initialLines;

    return (
        <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-lg border border-gray-800 font-mono text-sm my-6">
            <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-gray-700">
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-gray-400 text-xs font-semibold uppercase">{language}</span>
            </div>

            <div className="p-4 overflow-x-auto text-gray-300 leading-relaxed relative">
                <pre>
                    <code>
                        {displayLines.map((line, i) => (
                            <div key={i} className="table-row">
                                <span className="table-cell text-right pr-4 select-none text-gray-600 w-8">{i + 1}</span>
                                <span className="table-cell whitespace-pre">{line}</span>
                            </div>
                        ))}
                    </code>
                </pre>

                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none"></div>
                )}
            </div>

            {!isExpanded && (
                <div className="p-4 bg-[#252526] border-t border-gray-800 text-center">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Show remaining {hiddenCount} lines
                    </button>
                </div>
            )}

            {isExpanded && (
                <div className="p-2 bg-[#252526] border-t border-gray-800 text-center">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-gray-400 hover:text-white text-xs py-2 transition-colors"
                    >
                        Collapse code
                    </button>
                </div>
            )}
        </div>
    );
}
