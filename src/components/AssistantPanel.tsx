
import React from 'react';
import { TripInsight } from '../types';
import { Sparkles, Info, Clock } from 'lucide-react';

interface AssistantPanelProps {
  insights: TripInsight[];
  loading: boolean;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-3xl shadow-xl animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl shadow-lg border border-indigo-100">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-indigo-900">OpusAIMobility Smart Insights</h3>
      </div>
      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-indigo-50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Info className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-indigo-900 text-sm">{insight.title}</p>
                <p className="text-indigo-800 text-xs leading-relaxed mt-1 opacity-80">
                  {insight.description}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  Impact: {insight.estimatedTimeAddition}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssistantPanel;
