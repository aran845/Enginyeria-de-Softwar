import { useState, useEffect } from 'react';

export default function FlashMessage({ message, type = 'success' }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

    return (
        <div className="flash-container">
            <div className={`flash flash-${type}`}>
                <span className="flash-icon">{icons[type] || 'ℹ'}</span>
                <span>{message}</span>
                <button className="flash-close" onClick={() => setVisible(false)}>×</button>
            </div>
        </div>
    );
}
