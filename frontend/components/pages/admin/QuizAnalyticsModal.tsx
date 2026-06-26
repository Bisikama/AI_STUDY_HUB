'use client';

import React, { useState, useEffect } from 'react';
import { adminApi, QuizAnalytics } from '@/services/adminApi';

interface QuizAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
}

export default function QuizAnalyticsModal({
  isOpen,
  onClose,
  quizId,
  quizTitle,
}: QuizAnalyticsModalProps) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && quizId) {
      const fetchAnalytics = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await adminApi.getQuizAnalytics(quizId);
          setAnalytics(data);
        } catch (err: any) {
          console.error('Failed to load quiz analytics:', err);
          setError(
            err.response?.data?.message || 'Không thể tải thống kê cho bộ câu hỏi này'
          );
        } finally {
          setLoading(false);
        }
      };
      void fetchAnalytics();
    }
  }, [isOpen, quizId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-full max-w-md rounded-[24px] bg-white p-8 shadow-2xl duration-200">
        <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-blue-50">
          <span className="material-symbols-outlined text-4xl text-blue-600">bar_chart</span>
        </div>

        <h2 className="mb-2 text-[22px] font-bold text-gray-900">Quiz Analytics</h2>
        <p className="mb-6 text-[14px] text-gray-500 font-medium truncate max-w-sm" title={quizTitle}>
          {quizTitle}
        </p>

        {loading ? (
          <div className="flex h-40 w-full items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 animate-spin text-3xl">sync</span>
          </div>
        ) : error ? (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-left text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">
                assignment_turned_in
              </span>
              <p className="text-sm font-semibold text-slate-500">Lượt tham gia</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {analytics?.totalAttempts ?? 0}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">
                grade
              </span>
              <p className="text-sm font-semibold text-slate-500">Điểm trung bình</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {analytics?.averageScore !== undefined
                  ? `${analytics.averageScore} / 10`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white transition-colors hover:bg-black"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
