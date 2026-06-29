'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminMetrics, AdminUser } from '@/services/adminApi';
import { teacherVerificationApi, TeacherVerificationData } from '@/services/teacherVerificationApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStorage(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
}

function shortId(uuid: string): string {
  return `#USR-${uuid.slice(0, 4).toUpperCase()}`;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function MetricCard({ label, value, sub, subColor = 'text-slate-400', icon, loading }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="text-3xl font-bold tracking-tight text-slate-800">{value}</p>
      )}
      <p className={`mt-1.5 text-xs font-medium ${subColor}`}>{sub}</p>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

const roleBadgeClass: Record<string, string> = {
  ADMIN:   'bg-blue-100 text-blue-700',
  TEACHER: 'bg-violet-100 text-violet-700',
  STUDENT: 'bg-slate-100 text-slate-600',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleBadgeClass[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {role === 'TEACHER' ? 'Giảng viên' : role === 'STUDENT' ? 'Sinh viên' : 'Quản trị viên'}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      ACTIVE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-500">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      INACTIVE
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const DocsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);
const StorageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
const StatusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [verifications, setVerifications] = useState<TeacherVerificationData[]>([]);
  const [activeTab, setActiveTab] = useState<'USERS' | 'VERIFICATIONS'>('USERS');
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter & pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = () => {
    setMetricsLoading(true);
    setUsersLoading(true);
    adminApi.getMetrics()
      .then(setMetrics)
      .catch(() => setError('Không thể tải metrics'))
      .finally(() => setMetricsLoading(false));

    adminApi.getAllUsers()
      .then(setUsers)
      .catch(() => setError('Không thể tải danh sách users'))
      .finally(() => setUsersLoading(false));
  };

  const loadVerifications = () => {
    setVerificationsLoading(true);
    teacherVerificationApi.getAdminList()
      .then((res: unknown) => {
        const resObj = res as { data?: unknown };
        const list = Array.isArray(res) ? res : Array.isArray(resObj?.data) ? resObj.data : [];
        setVerifications(list as TeacherVerificationData[]);
      })
      .catch(() => setError('Không thể tải danh sách xác thực Giảng viên'))
      .finally(() => setVerificationsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'VERIFICATIONS') {
      loadVerifications();
    }
  }, [activeTab]);

  const handleReviewVerification = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await teacherVerificationApi.reviewRequest(id, { status });
      loadVerifications();
      loadData(); // refresh user list role updates
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt!');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered + paginated users
  const safeUsers = Array.isArray(users) ? users : [];
  const filtered = safeUsers.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (role: typeof roleFilter) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };
  const handleSearch = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };

  // Active users count (derived)
  const activeCount = safeUsers.filter((u) => u.isActive).length;
  const safeVerifications = Array.isArray(verifications) ? verifications : [];
  const pendingVerificationsCount = safeVerifications.filter(v => v.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý người dùng, tài khoản và phê duyệt xác thực Giảng viên.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-200/60 p-1.5 self-start">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'USERS'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quản lý Người dùng ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('VERIFICATIONS')}
              className={`relative rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'VERIFICATIONS'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phê duyệt Giảng viên
              {pendingVerificationsCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingVerificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Users"
            value={metricsLoading ? '—' : (metrics?.totalUsers ?? 0).toLocaleString()}
            sub="Registered accounts"
            subColor="text-emerald-500"
            icon={<UsersIcon />}
            loading={metricsLoading}
          />
          <MetricCard
            label="Active Now"
            value={usersLoading ? '—' : activeCount.toLocaleString()}
            sub="● Real-time tracking"
            subColor="text-emerald-500"
            icon={<StatusIcon />}
            loading={usersLoading}
          />
          <MetricCard
            label="Total Documents"
            value={metricsLoading ? '—' : (metrics?.totalDocuments ?? 0).toLocaleString()}
            sub="Uploaded to system"
            subColor="text-slate-400"
            icon={<DocsIcon />}
            loading={metricsLoading}
          />
          <MetricCard
            label="Storage Used"
            value={metricsLoading ? '—' : formatStorage(metrics?.totalStorage ?? 0)}
            sub="⊙ Supabase Cloud Storage"
            subColor="text-slate-400"
            icon={<StorageIcon />}
            loading={metricsLoading}
          />
        </div>

        {/* ── TAB CONTENT: USERS ── */}
        {activeTab === 'USERS' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Danh sách người dùng</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {usersLoading ? 'Đang tải...' : `Tìm thấy ${filtered.length} kết quả`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc email..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                  {(['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleFilterChange(r)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        roleFilter === r
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'ALL' ? 'Tất cả' : r === 'TEACHER' ? 'Giảng viên' : r === 'STUDENT' ? 'Sinh viên' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Họ và tên</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-blue-400">Email</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Tài liệu</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-blue-400">Vai trò</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-3.5 animate-pulse rounded bg-slate-100" style={{ width: `${60 + j * 10}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                        Không có người dùng nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] font-semibold text-slate-400">
                          {shortId(user.id)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {user.fullName}
                        </td>
                        <td className="px-6 py-4 text-blue-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600 font-medium">
                          {user._count.documents}
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge isActive={user.isActive} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!usersLoading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <p className="text-xs text-slate-400">
                  Hiển thị {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} mục
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-semibold transition ${
                        currentPage === p
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: TEACHER VERIFICATIONS ── */}
        {activeTab === 'VERIFICATIONS' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Yêu cầu xác thực Giảng viên</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Duyệt minh chứng để nâng quyền tài khoản người dùng lên Giảng viên (`TEACHER`).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Người đăng ký</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Mã Giảng viên</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Khoa / Bộ môn</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Minh chứng</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verificationsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 animate-pulse rounded bg-slate-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : verifications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                        Chưa có yêu cầu xác thực Giảng viên nào.
                      </td>
                    </tr>
                  ) : (
                    verifications.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{item.user?.fullName || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{item.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-700">
                          {item.teacherCode}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.department || '—'}
                        </td>
                        <td className="px-6 py-4">
                          {item.proofUrl ? (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Xem minh chứng</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Không gửi kèm</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.status === 'PENDING' && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                              Chờ phê duyệt
                            </span>
                          )}
                          {item.status === 'APPROVED' && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              Đã phê duyệt (Giảng viên)
                            </span>
                          )}
                          {item.status === 'REJECTED' && (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                              Từ chối
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReviewVerification(item.id, 'APPROVED')}
                                disabled={processingId === item.id}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Phê duyệt
                              </button>
                              <button
                                onClick={() => handleReviewVerification(item.id, 'REJECTED')}
                                disabled={processingId === item.id}
                                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
