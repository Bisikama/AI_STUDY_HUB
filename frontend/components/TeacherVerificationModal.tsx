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
      setError('Please enter Teacher ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await teacherVerificationApi.submit({
        teacherCode: teacherCode.trim(),
        department: department.trim() || undefined,
        proofUrl: proofUrl.trim() || undefined,
      });
      setSuccessMsg('Teacher verification request submitted successfully! Admins will review it soon.');
      await loadStatus();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'An error occurred while submitting the request.');
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
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Teacher Verification</h3>
            <p className="text-xs text-slate-500">Teachers can upload public documents without going through review.</p>
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
                  <div className="border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-3">
                    <p className="font-bold">⏳ Verification request is pending review</p>
                    <p className="mt-1">ID: {myStatus.teacherCode} — Dept: {myStatus.department || 'Not provided'}</p>
                  </div>
                )}
                {myStatus.status === 'APPROVED' && (
                  <div className="border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg p-3">
                    <p className="font-bold">✅ Your account has been verified as a Teacher!</p>
                    <p className="mt-1">You now have full teacher privileges on the system.</p>
                  </div>
                )}
                {myStatus.status === 'REJECTED' && (
                  <div className="border-rose-200 bg-rose-50 text-rose-800 rounded-lg p-3">
                    <p className="font-bold">❌ Previous request was rejected</p>
                    {myStatus.adminNote && <p className="mt-1">Reason: {myStatus.adminNote}</p>}
                    <p className="mt-1 font-medium">You can update your info and submit again below.</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-200">
                ⚠️ {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                ✅ {successMsg}
              </div>
            )}

            {myStatus?.status !== 'APPROVED' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teacher ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g.: T10293"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department / Faculty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g.: Computer Science Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Link to ID Card / Proof (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/the-giang-vien.jpg"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
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
