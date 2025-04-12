import React from 'react';

interface ResearchSection {
    title: string;
    content: string;
    type: 'research';
}

interface ResearchDisplayProps {
    researchData: ResearchSection[];
}

const ResearchDisplay: React.FC<ResearchDisplayProps> = ({ researchData }) => {
    if (!researchData.length) {
        return null;
    }

    return (
        <div className="space-y-6">
            {researchData.map((section, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        {section.title}
                    </h3>
                    <div className="prose dark:prose-invert max-w-none">
                        {section.content.split('\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className="mb-4 text-gray-700 dark:text-gray-300">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ResearchDisplay; 