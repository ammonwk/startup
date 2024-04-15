import React, { useState, useEffect, useRef } from 'react';

const ResponsiveText = ({ text, lineHeight, color, backgroundColor }) => {
    const ref = useRef(null);
    const [lineClamp, setLineClamp] = useState(1);
    const [finalLineHeight, setFinalLineHeight] = useState(lineHeight);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { height } = entry.contentRect;
                let lineHeightPx = parseFloat(lineHeight);
                const newLineClamp = Math.max(1, Math.floor(height / lineHeightPx));
                const newLineHeight = lineHeight + (height % lineHeightPx) / newLineClamp;
                setLineClamp(newLineClamp);
                setFinalLineHeight(newLineHeight);
            }
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                resizeObserver.disconnect();
            }
        };
    }, [lineHeight]);

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: '100%',
        padding: '0 5px',
        backgroundColor,
    };

    const textStyle = {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: lineClamp,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'left',
        color,
        lineHeight: `${finalLineHeight}px`,
        width: '100%', // Ensure it takes full width for correct centering
    };

    return (
        <div ref={ref} style={containerStyle}>
            <div style={textStyle}>
                {text}
            </div>
        </div>
    );
};

export default ResponsiveText;
