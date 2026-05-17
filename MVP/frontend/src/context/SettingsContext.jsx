import { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../api/api';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        email_notifications: true,
        renewal_alerts: true,
        monthly_report: false,
        budget_alert: true,
        budget_limit: 100,
        currency: 'EUR',
        theme: 'dark',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
            applyTheme(data.theme);
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (theme) => {
        const html = document.documentElement;
        html.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            html.style.colorScheme = 'dark';
        } else if (theme === 'light') {
            html.style.colorScheme = 'light';
        }
    };

    const updateSettings = async (updates) => {
        try {
            const newSettings = { ...settings, ...updates };
            const result = await saveSettings(updates);
            setSettings(result.settings || newSettings);

            if (updates.theme) {
                applyTheme(updates.theme);
            }
            return true;
        } catch (err) {
            console.error('Error updating settings:', err);
            return false;
        }
    };

    const getCurrencySymbol = () => {
        const symbols = {
            'EUR': '€',
            'USD': '$',
            'GBP': '£'
        };
        return symbols[settings.currency] || '€';
    };

    const formatPrice = (price) => {
        return `${getCurrencySymbol()}${price.toFixed(2)}`;
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            loading,
            updateSettings,
            getCurrencySymbol,
            formatPrice,
            loadSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings debe usarse dentro de SettingsProvider');
    }
    return context;
}
