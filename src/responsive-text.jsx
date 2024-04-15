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
                // Make line height an even divisor of height to cut off overflowing text
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

    const style = {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: lineClamp,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'left',
        backgroundColor,
        color,
        lineHeight: `${finalLineHeight}px`,
        height: '100%',
    };

    return (
        <div ref={ref} style={style}>
            {text}
        </div>
    );
};

export default ResponsiveText;
