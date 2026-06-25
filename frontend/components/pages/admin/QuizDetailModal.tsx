'use client';

import React, { useState, useEffect } from 'react';
import { adminApi, AdminQuizDetail } from '@/services/adminApi';

interface QuizDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
  onUpdateSuccess?: () => void;
}

export default function QuizDetailModal({
  isOpen,
  onClose,
  quizId,
  quizTitle,
  onUpdateSuccess,
}: QuizDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [quizDetail, setQuizDetail] = useState<AdminQuizDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active question state
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; optionText: string; isCorrect: boolean }>>([]);
  const [saving, setSaving] = useState(false);

  // Load quiz details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const data = await adminApi.getQuizById(quizId);
      setQuizDetail(data);
      setActiveQuestionIdx(0);
    } catch (err: any) {
      console.error('Failed to load quiz detail:', err);
      setError(err.response?.data?.message || 'Không thể tải chi tiết bộ câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && quizId) {
      void fetchDetails();
    }
  }, [isOpen, quizId]);

  // Set active question inputs when changing question or when data loaded
  useEffect(() => {
    if (quizDetail && quizDetail.questions[activeQuestionIdx]) {
      const q = quizDetail.questions[activeQuestionIdx];
      setQuestionText(q.questionText);
      setOptions(
        q.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        }))
      );
      setError(null);
      setSuccessMsg(null);
    }
  }, [quizDetail, activeQuestionIdx]);

  if (!isOpen) return null;

  const handleOptionTextChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].optionText = text;
    setOptions(updated);
  };

  const handleOptionCorrectChange = (correctIdx: number) => {
    const updated = options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === correctIdx,
    }));
    setOptions(updated);
  };

  const handleSaveQuestion = async () => {
    if (!quizDetail) return;
    const activeQuestion = quizDetail.questions[activeQuestionIdx];
    if (!activeQuestion) return;

    if (!questionText.trim()) {
      setError('Nội dung câu hỏi không được trống');
      return;
    }

    if (options.some((opt) => !opt.optionText.trim())) {
      setError('Các phương án lựa chọn không được trống');
      return;
    }

    const correctCount = options.filter((opt) => opt.isCorrect).length;
    if (correctCount !== 1) {
      setError('Phải chọn đúng 1 đáp án chính xác');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      await adminApi.updateQuizQuestion(activeQuestion.id, {
        questionText: questionText.trim(),
        options,
      });

      setSuccessMsg('Đã lưu câu hỏi thành công!');
      
      // Update local detail state
      const updatedQuestions = [...quizDetail.questions];
      updatedQuestions[activeQuestionIdx] = {
        ...activeQuestion,
        questionText: questionText.trim(),
        options: options.map((opt) => ({
          ...opt,
          questionId: activeQuestion.id,
          createdAt: new Date().toISOString(),
        })),
      };

      setQuizDetail({
        ...quizDetail,
        questions: updatedQuestions,
      });

      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (err: any) {
      console.error('Failed to update question:', err);
      setError(err.response?.data?.message || 'Không thể lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-full max-w-4xl rounded-[24px] bg-white shadow-2xl duration-200 flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Chỉnh sửa bộ câu hỏi</h2>
            <p className="text-[13px] text-gray-500 font-medium truncate max-w-md" title={quizTitle}>
              {quizTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 animate-spin text-3xl">sync</span>
          </div>
        ) : error && !quizDetail ? (
          <div className="p-8">
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar (Questions navigation) */}
            <div className="w-1/4 border-r border-slate-100 bg-slate-50 p-4 overflow-y-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
                Danh sách câu hỏi
              </p>
              <div className="space-y-1">
                {quizDetail?.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      idx === activeQuestionIdx
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Câu hỏi {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Pane (Active question edit form) */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nội dung câu hỏi {activeQuestionIdx + 1}
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Các phương án trả lời (Chọn 1 phương án đúng)
                  </label>
                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={opt.isCorrect}
                          onChange={() => handleOptionCorrectChange(idx)}
                          className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-600"
                        />
                        <input
                          type="text"
                          value={opt.optionText}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
                    {successMsg}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveQuestion}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
