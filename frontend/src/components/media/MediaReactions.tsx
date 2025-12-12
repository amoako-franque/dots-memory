import { useState, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api';

interface MediaReactionsProps {
    mediaId: string;
    enabled?: boolean;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

interface Reaction {
    emoji: string;
    count: number;
    userReacted: boolean;
}

export default function MediaReactions({ mediaId, enabled = true }: MediaReactionsProps) {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPicker, setShowPicker] = useState(false);
    const [deviceId, setDeviceId] = useState<string>('');

    useEffect(() => {
        let storedDeviceId = localStorage.getItem('deviceId');
        if (!storedDeviceId) {
            storedDeviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('deviceId', storedDeviceId);
        }
        setDeviceId(storedDeviceId);
    }, []);

    useEffect(() => {
        if (deviceId) {
            fetchReactions();
        }
    }, [mediaId, deviceId]);

    const fetchReactions = async () => {
        if (!deviceId) return;

        try {
            const response = await api.get(`/media/${mediaId}/reactions`, {
                headers: {
                    'x-device-id': deviceId,
                },
            });

            const reactionsData = response.data?.data || [];
            const groupedReactions = new Map<string, { count: number; userReacted: boolean }>();

            reactionsData.forEach((r: any) => {
                const key = r.emoji;
                if (!groupedReactions.has(key)) {
                    groupedReactions.set(key, { count: 0, userReacted: false });
                }
                const current = groupedReactions.get(key)!;
                current.count++;
                if (r.deviceId === deviceId) {
                    current.userReacted = true;
                }
            });

            const reactionsList: Reaction[] = Array.from(groupedReactions.entries()).map(([emoji, data]) => ({
                emoji,
                ...data,
            }));

            setReactions(reactionsList);
        } catch (error) {
            console.error('Failed to fetch reactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReaction = async (emoji: string) => {
        if (!enabled) return;

        try {
            const existingReaction = reactions.find(r => r.emoji === emoji && r.userReacted);

            if (existingReaction) {
                await api.delete(`/media/${mediaId}/reactions/${encodeURIComponent(emoji)}`, {
                    headers: {
                        'x-device-id': deviceId,
                    },
                });
            } else {
                await api.post(`/media/${mediaId}/reactions`, {
                    emoji,
                }, {
                    headers: {
                        'x-device-id': deviceId,
                    },
                });
            }

            fetchReactions();
            setShowPicker(false);
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        }
    };

    if (!enabled) return null;

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B2E3C] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Existing Reactions */}
            {reactions.map((reaction) => (
                <Button
                    key={reaction.emoji}
                    variant={reaction.userReacted ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleReaction(reaction.emoji)}
                    className="h-8 px-2 text-sm"
                >
                    <span className="text-base mr-1">{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                </Button>
            ))}

            {/* Add Reaction Button */}
            <div className="relative">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPicker(!showPicker)}
                    className="h-8"
                >
                    <Smile className="h-4 w-4" />
                </Button>

                {showPicker && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border-2 border-[#E8D4B8] rounded-lg shadow-lg z-10 grid grid-cols-4 gap-1">
                        {EMOJI_OPTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#F5E6D3] rounded transition-colors text-lg"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

