import React, { createContext, useState, useContext } from 'react';

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
    };

    return (
        <SettingsContext.Provider value={{ settings, changeSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};
