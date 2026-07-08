'use client';

import React, { useState, useEffect } from 'react';
import { teacherVerificationApi, TeacherVerificationData } from '@/services/teacherVerificationApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeacherVerificationModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [myStatus, setMyStatus] = useState<TeacherVerificationData | null>(null);

  const [teacherCode, setTeacherCode] = useState('');
  const [department, setDepartment] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadStatus = async () => {
    setFetching(true);
    try {
      const data = await teacherVerificationApi.getMyStatus();
      setMyStatus(data);
      if (data) {
        setTeacherCode(data.teacherCode || '');
        setDepartment(data.department || '');
        setProofUrl(data.proofUrl || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherCode.trim()) {
      setError('Vui lòng nhập Mã giảng viên');
      return;
    }
    if (!department.trim()) {
      setError('Vui lòng nhập Khoa / Bộ môn');
      return;
    }
    if (!proofUrl.trim()) {
      setError('Vui lòng nhập Link minh chứng');
      return;
    }

    try {
      new URL(proofUrl.trim());
    } catch {
      setError('Link minh chứng phải là một URL hợp lệ (ví dụ: https://...)');
      return;
    }

    if (!agreed) {
      setError('Bạn phải đọc và đồng ý với cam kết luật lệ để tiếp tục.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await teacherVerificationApi.submit({
        teacherCode: teacherCode.trim(),
        department: department.trim(),
        proofUrl: proofUrl.trim(),
      });
      setSuccessMsg('Gửi yêu cầu Xác Thực Giảng viên thành công! Admin sẽ duyệt sớm.');
      await loadStatus();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Teacher Verification</h3>
            <p className="text-xs text-slate-500">
              Teachers can upload public documents without going through review.
            </p>
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading info...</div>
        ) : (
          <div>
            {/* Status Alert Banner */}
            {myStatus && (
              <div className="mb-5 rounded-xl border p-4 text-xs">
                {myStatus.status === 'PENDING' && (
                  <div className="rounded-lg border-amber-200 bg-amber-50 p-3 text-amber-800">
                    <p className="font-bold">⏳ Verification request is pending review</p>
                    <p className="mt-1">
                      ID: {myStatus.teacherCode} — Dept: {myStatus.department || 'Not provided'}
                    </p>
                  </div>
                )}
                {myStatus.status === 'APPROVED' && (
                  <div className="rounded-lg border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                    <p className="font-bold">✅ Your account has been verified as a Teacher!</p>
                    <p className="mt-1">You now have full teacher privileges on the system.</p>
                  </div>
                )}
                {myStatus.status === 'REJECTED' && (
                  <div className="rounded-lg border-rose-200 bg-rose-50 p-3 text-rose-800">
                    <p className="font-bold">❌ Previous request was rejected</p>
                    {myStatus.adminNote && <p className="mt-1">Reason: {myStatus.adminNote}</p>}
                    <p className="mt-1 font-medium">
                      You can update your info and submit again below.
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                ⚠️ {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                ✅ {successMsg}
              </div>
            )}

            {myStatus?.status !== 'APPROVED' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Mã giảng viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: T10293"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Khoa / Bộ môn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Khoa Công nghệ thông tin"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Link minh chứng (Thẻ GV / Quyết định) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/the-giang-vien.jpg"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                {/* Cam kết luật lệ */}
                <div className="space-y-2 rounded-xl border border-amber-200/60 bg-amber-50/70 p-4 text-xs text-amber-900">
                  <p className="flex items-center gap-1.5 font-bold text-amber-800">
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    CAM KẾT LUẬT LỆ GIẢNG VIÊN:
                  </p>
                  <ul className="list-disc space-y-1 pl-4 font-medium text-slate-600">
                    <li>
                      Không đăng tải tài liệu vi phạm bản quyền hoặc nội dung không lành mạnh.
                    </li>
                    <li>Tài liệu chia sẻ phải chính xác, phục vụ tốt cho mục đích học tập.</li>
                    <li>
                      Nếu vi phạm quy định hoặc bị báo cáo vi phạm nghiêm trọng, tài khoản của bạn
                      sẽ bị hạ quyền về <strong>Sinh viên (STUDENT)</strong> và chặn nâng quyền
                      Giảng viên vĩnh viễn.
                    </li>
                  </ul>
                  <label className="flex cursor-pointer items-start gap-2 pt-1.5 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span>Tôi đồng ý với cam kết luật lệ trên</span>
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !agreed}
                    className="rounded-lg bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
