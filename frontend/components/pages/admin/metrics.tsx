'use client';

import { useAdminMetrics } from '@/hooks/useAdminMetrics';

interface MetricCardProps {
    value: string | number;
    label: string;
    borderColor: string;
    bgGradient: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    value,
    label,
    borderColor,
    bgGradient,
}) => {
    return (
        <div
            className={`rounded-xl border-2 ${borderColor} ${bgGradient} p-6 backdrop-blur-sm transition-transform hover:scale-105`}
        >
            <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white">{value}</h3>
                <p className="text-sm text-gray-300">{label}</p>
            </div>
        </div>
    );
};

export default function MetricsPage() {
    const { metrics, loading, error } = useAdminMetrics();

    const staticMetrics = [
        {

            label: 'Total Registered Students',
            borderColor: 'border-cyan-500',
            bgGradient: 'bg-gradient-to-br from-cyan-900/20 to-blue-900/20',
        },
        {

            label: 'Total Stored Files',
            borderColor: 'border-purple-500',
            bgGradient: 'bg-gradient-to-br from-purple-900/20 to-pink-900/20',
        },
        {

            label: 'S3 / Supabase Storage',
            borderColor: 'border-pink-500',
            bgGradient: 'bg-gradient-to-br from-pink-900/20 to-rose-900/20',
        },
    ];

    const displayMetrics = metrics
        ? [
            { ...staticMetrics[0], value: metrics.totalUsers },
            { ...staticMetrics[1], value: metrics.totalDocuments },
            { ...staticMetrics[2], value: `${(metrics.totalStorage / 1024 / 1024 / 1024).toFixed(2)} GB` },
        ]
        : [];

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                    <p className="mt-2 text-gray-400">View your system overview</p>
                    {loading && <p className="mt-2 text-sm text-yellow-400">Loading data...</p>}
                    {error && <p className="mt-2 text-sm text-red-400">Error: {error}</p>}
                </div>

                {/* Metrics Grid */}
                {displayMetrics.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {displayMetrics.map((metric, index) => (
                            <MetricCard
                                key={index}
                                value={metric.value}
                                label={metric.label}
                                borderColor={metric.borderColor}
                                bgGradient={metric.bgGradient}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border-2 border-gray-600 bg-slate-900/50 p-8 text-center">
                        <p className="text-gray-400">No data</p>
                    </div>
                )}
            </div>
        </div>
    );
}
