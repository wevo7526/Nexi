import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext({
    showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');

    const showToast = useCallback((message, severity = 'success') => {
        setMessage(message);
        setSeverity(severity);
        setOpen(true);
    }, []);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                            fontSize: '1.25rem',
                        },
                    }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
} 