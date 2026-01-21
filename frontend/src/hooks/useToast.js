import { useState, useCallback } from 'react';

export function useToast(duration = 2000) {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), duration);
    }, [duration]);

    return { toast, showToast };
}
