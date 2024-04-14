import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        theme: 'light',
        notifications: true,
        multiplePlanners: false,
        comfiness: 1,
    });

    // Load settings from the server when the component mounts
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const loadedSettings = await response.json();
                    setSettings(loadedSettings);
                } else {
                    console.log('Failed to load settings from the server.', response.status);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, []);

    const changeSetting = (key, value) => {
        setSettings(prevSettings => {
            const newSettings = { ...prevSettings, [key]: value };
            if (key === 'theme') {
                document.body.setAttribute('data-theme', value);
            }
            saveSettings(newSettings);
            return newSettings;
        });
    };

    // Save settings to the server
    const saveSettings = async (updatedSettings) => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSettings),
            });
            if (!response.ok) {
                throw new Error('Failed to save settings to the server');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    // Apply theme setting to document body
    useEffect(() => {
        document.body.setAttribute('data-theme', settings.theme);
        saveSettings(settings);
    }, [settings.theme]);

    return (
        <SettingsContext.Provider value={{ settings, changeSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};
