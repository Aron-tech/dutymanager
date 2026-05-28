import { useEffect, useRef, useState } from 'react';

interface stat_counter_props {
    value: number;
    suffix?: string;
    decimals?: number;
}

// Animates a number from 0 to `value` once it scrolls into view.
export default function StatCounter({ value, suffix = '', decimals = 0 }: stat_counter_props) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const has_run = useRef(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || has_run.current) {
                        return;
                    }

                    has_run.current = true;
                    const duration = 1600;
                    const start_time = performance.now();

                    const tick = (now: number) => {
                        const progress = Math.min((now - start_time) / duration, 1);
                        // easeOutExpo for a snappy finish.
                        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                        setDisplay(value * eased);

                        if (progress < 1) {
                            requestAnimationFrame(tick);
                        }
                    };

                    requestAnimationFrame(tick);
                });
            },
            { threshold: 0.4 },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [value]);

    const formatted =
        decimals > 0
            ? display.toFixed(decimals)
            : Math.floor(display).toLocaleString('en-US');

    return (
        <span ref={ref}>
            {formatted}
            {suffix}
        </span>
    );
}
