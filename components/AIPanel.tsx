import React, { useState, useEffect } from 'react';
import { analyzeMessage } from '../services/geminiService';
import type { Message, AIAnalysisResult, Priority } from '../types';
import { SparklesIcon } from './icons';

interface AIPanelProps {
  message: Message;
  onSelectReply: (replyText: string) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full";
  const colorClasses = {
    'High Priority': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Normal': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Low Priority': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Unknown': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  };
  return <span className={`${baseClasses} ${colorClasses[priority]}`}>{priority}</span>;
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-32"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-24"></div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-6"></div>
        <div className="space-y-2">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/3"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/2"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-2/5"></div>
        </div>
    </div>
);

export const AIPanel: React.FC<AIPanelProps> = ({ message, onSelectReply }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      try {
        const result = await analyzeMessage(message.body);
        setAnalysis(result);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    getAnalysis();
  }, [message]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
      <div className="flex items-center mb-4">
        <SparklesIcon className="w-6 h-6 text-primary-500 mr-2" />
        <h3 className="text-lg font-bold">AI Assistant</h3>
      </div>
      {isLoading && <SkeletonLoader />}
      {error && <p className="text-red-500">{error}</p>}
      {analysis && !isLoading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-600 dark:text-gray-300">Priority & Summary</p>
            <PriorityBadge priority={analysis.priority} />
          </div>
          <p className="text-gray-700 dark:text-gray-400 italic mb-6">"{analysis.summary}"</p>
          
          <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Suggested Replies</p>
          <div className="flex flex-wrap gap-2">
            {analysis.replies.map((reply, index) => (
              <button
                key={index}
                onClick={() => onSelectReply(reply)}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};