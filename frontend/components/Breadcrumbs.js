import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { NavigateNext } from '@mui/icons-material';

const routeNameMap = {
    '': 'Home',
    'consultant': 'Consultant',
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'profile': 'Profile',
};

const Breadcrumbs = () => {
    const router = useRouter();
    const pathSegments = router.asPath.split('/').filter(Boolean);

    const handleClick = (path) => (event) => {
        event.preventDefault();
        router.push(path);
    };

    return (
        <MuiBreadcrumbs 
            separator={<NavigateNext fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 3 }}
        >
            <Link
                underline="hover"
                color="inherit"
                href="/"
                onClick={handleClick('/')}
                sx={{ display: 'flex', alignItems: 'center' }}
            >
                Home
            </Link>
            {pathSegments.map((segment, index) => {
                const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                const name = routeNameMap[segment] || segment;

                return isLast ? (
                    <Typography 
                        key={path} 
                        color="text.primary"
                        sx={{ 
                            textTransform: 'capitalize',
                            fontWeight: 500
                        }}
                    >
                        {name}
                    </Typography>
                ) : (
                    <Link
                        key={path}
                        underline="hover"
                        color="inherit"
                        href={path}
                        onClick={handleClick(path)}
                        sx={{ textTransform: 'capitalize' }}
                    >
                        {name}
                    </Link>
                );
            })}
        </MuiBreadcrumbs>
    );
};

export default Breadcrumbs; 