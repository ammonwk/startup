import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        theme: 'light',  // Default settings
        notifications: true,
    });

    const changeSetting = (key, value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [key]: value
        }));
        if (key === 'theme') {
            document.body.setAttribute('data-theme', value);
        }
    };

    useEffect(() => {
        document.body.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    return (
        <SettingsContext.Provider value={{ settings, changeSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};
