import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const MessageSkeleton = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        {/* User message skeleton */}
        <Box sx={{ alignSelf: 'flex-end', maxWidth: '60%' }}>
            <Skeleton 
                variant="rounded" 
                width="100%" 
                height={60}
                sx={{ borderRadius: '12px 12px 0 12px' }}
            />
        </Box>
        
        {/* Assistant message skeleton */}
        <Box sx={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
            <Skeleton 
                variant="rounded" 
                width="100%" 
                height={100}
                sx={{ borderRadius: '12px 12px 12px 0' }}
            />
        </Box>
    </Box>
);

export const CardSkeleton = () => (
    <Box sx={{ width: '100%' }}>
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={100} height={32} />
        </Box>
    </Box>
);

export const StatsSkeleton = () => (
    <Box sx={{ display: 'flex', gap: 3, width: '100%', mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ flex: 1 }}>
                <Skeleton variant="rounded" height={140} />
            </Box>
        ))}
    </Box>
);

const LoadingSkeleton = {
    Message: MessageSkeleton,
    Card: CardSkeleton,
    Stats: StatsSkeleton,
};

export default LoadingSkeleton; 