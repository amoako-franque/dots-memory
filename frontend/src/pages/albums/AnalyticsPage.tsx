import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Upload, Download, Users, Globe, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

interface AlbumStats {
    views: number;
    downloads: number;
    mediaCount: number;
    uniqueContributors: number;
    totalSizeBytes: string;
    totalSizeMB: number;
}

interface AnalyticsData {
    totalViews: number;
    totalScans: number;
    totalUploads: number;
    totalDownloads: number;
    uniqueDevices: number;
    viewsByDay: Array<{ date: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
}

interface ActivityItem {
    id: string;
    eventType: string;
    country: string | null;
    city: string | null;
    timestamp: string;
    metadata: any;
}

export default function AnalyticsPage() {
    const { id } = useParams<{ id: string }>();
    const [albumName, setAlbumName] = useState<string>('');
    const [stats, setStats] = useState<AlbumStats | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                setIsLoading(true);
                setError(null);

                const albumRes = await api.get(`/albums/${id}`);
                setAlbumName(albumRes.data?.data?.album?.name || '');

                const statsRes = await api.get(`/albums/${id}/stats`);
                setStats(statsRes.data?.data?.stats);

                const analyticsRes = await api.get(`/albums/${id}/analytics?days=${days}`);
                setAnalytics(analyticsRes.data?.data?.stats || null);

                const activityRes = await api.get(`/albums/${id}/activity?limit=20`);
                setActivity(activityRes.data?.data?.activity || []);
            } catch (err: any) {
                setError(err.response?.data?.error?.message || 'Failed to load analytics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, days]);

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            ALBUM_VIEW: 'Album Viewed',
            ALBUM_SCAN: 'QR Code Scanned',
            MEDIA_UPLOAD: 'Media Uploaded',
            MEDIA_VIEW: 'Media Viewed',
            MEDIA_DOWNLOAD: 'Media Downloaded',
            BULK_DOWNLOAD: 'Bulk Download',
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B2E3C] border-r-transparent"></div>
                    <p className="text-[#6B5A42]">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <Card className="max-w-md border-2 border-[#D9A0A8] bg-[#F5E8EA]">
                    <CardContent className="pt-6">
                        <p className="text-center text-[#8B2E3C] font-medium">{error}</p>
                        <Link to={`/albums/${id}`} className="mt-4 block">
                            <Button variant="secondary" className="w-full">Back to Album</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={`/albums/${id}`}>
                        <Button variant="secondary" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-[#8B7355]">{albumName}</h1>
                        <p className="text-[#6B5A42]">Analytics Dashboard</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[7, 30, 90].map((d) => (
                        <Button
                            key={d}
                            variant={days === d ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setDays(d)}
                        >
                            {d}d
                        </Button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2 border-[#E8D4B8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#6B5A42] font-medium">Total Views</p>
                                <p className="text-2xl font-bold text-[#8B7355] mt-1">
                                    {stats?.views || analytics?.totalViews || 0}
                                </p>
                            </div>
                            <div className="rounded-full bg-[#D4E4F0] p-3">
                                <Eye className="h-6 w-6 text-[#5A8BB0]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-[#E8D4B8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#6B5A42] font-medium">Uploads</p>
                                <p className="text-2xl font-bold text-[#8B7355] mt-1">
                                    {analytics?.totalUploads || 0}
                                </p>
                            </div>
                            <div className="rounded-full bg-[#F5E6D3] p-3">
                                <Upload className="h-6 w-6 text-[#8B7355]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-[#E8D4B8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#6B5A42] font-medium">Downloads</p>
                                <p className="text-2xl font-bold text-[#8B7355] mt-1">
                                    {stats?.downloads || analytics?.totalDownloads || 0}
                                </p>
                            </div>
                            <div className="rounded-full bg-[#F5E8EA] p-3">
                                <Download className="h-6 w-6 text-[#8B2E3C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-[#E8D4B8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#6B5A42] font-medium">Contributors</p>
                                <p className="text-2xl font-bold text-[#8B7355] mt-1">
                                    {stats?.uniqueContributors || analytics?.uniqueDevices || 0}
                                </p>
                            </div>
                            <div className="rounded-full bg-[#D4E4F0] p-3">
                                <Users className="h-6 w-6 text-[#5A8BB0]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Views Chart */}
            {analytics && analytics.viewsByDay.length > 0 && (
                <Card className="border-2 border-[#E8D4B8]">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#8B7355] flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Views Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics.viewsByDay.map((day) => {
                                const maxViews = Math.max(...analytics.viewsByDay.map(d => d.count));
                                const percentage = maxViews > 0 ? (day.count / maxViews) * 100 : 0;
                                return (
                                    <div key={day.date} className="flex items-center gap-4">
                                        <div className="w-24 text-sm text-[#6B5A42]">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-6 bg-[#F5E6D3] rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-[#8B2E3C] transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-12 text-sm font-medium text-[#8B7355] text-right">
                                            {day.count}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Countries */}
            {analytics && analytics.topCountries.length > 0 && (
                <Card className="border-2 border-[#E8D4B8]">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#8B7355] flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Top Countries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topCountries.map((country, idx) => (
                                <div key={country.country} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#D4E4F0] flex items-center justify-center text-sm font-bold text-[#5A8BB0]">
                                            {idx + 1}
                                        </div>
                                        <span className="text-[#6B5A42] font-medium">{country.country}</span>
                                    </div>
                                    <span className="text-[#8B7355] font-semibold">{country.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity */}
            {activity.length > 0 && (
                <Card className="border-2 border-[#E8D4B8]">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#8B7355] flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activity.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-[#FDF8F3] rounded-lg border border-[#E8D4B8]">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#8B7355]">
                                            {getEventTypeLabel(item.eventType)}
                                        </p>
                                        <p className="text-xs text-[#6B5A42] mt-1">
                                            {new Date(item.timestamp).toLocaleString()}
                                            {item.country && ` • ${item.country}`}
                                            {item.city && `, ${item.city}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

