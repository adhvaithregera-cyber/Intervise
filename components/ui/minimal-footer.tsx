'use client';

import { Heart } from 'lucide-react';

export function MinimalFooter() {
    const year = new Date().getFullYear();

    const company = [
        { title: 'About Intervise', href: '#' },
        { title: 'Careers', href: '#' },
        { title: 'Blog', href: '#' },
        { title: 'Privacy Policy', href: '#' },
        { title: 'Terms of Service', href: '#' },
    ];

    const resources = [
        { title: 'Documentation', href: '#' },
        { title: 'Help Center', href: '#' },
        { title: 'Contact Support', href: '#' },
        { title: 'FAQ', href: '#' },
        { title: 'Community', href: '#' },
    ];

    const socialLinks = [
        {
            icon: <Heart className="size-4" />,
            link: 'https://www.instagram.com/intervisehq/',
            label: 'Instagram',
        },
    ];

    return (
        <footer className="relative mt-20 w-full overflow-hidden">
            {/* Subtle dot pattern backdrop */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div
                className="relative mx-auto max-w-7xl border-t"
                style={{ borderColor: 'rgba(255,255,255,0.10)' }}
            >
                {/* Main footer content — centered layout */}
                <div className="flex flex-col items-center gap-12 px-6 py-12 md:px-12 md:py-16">
                    {/* Links grid — centered */}
                    <div className="flex flex-col items-center gap-8 md:flex-row md:gap-16">
                        {/* Resources column */}
                        <div className="text-center">
                            <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-white/40">
                                Resources
                            </span>
                            <div className="flex flex-col gap-2">
                                {resources.map(({ href, title }, i) => (
                                    <a
                                        key={i}
                                        className="text-sm text-white/60 transition-colors hover:text-white"
                                        href={href}
                                    >
                                        {title}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Company column */}
                        <div className="text-center">
                            <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-white/40">
                                Company
                            </span>
                            <div className="flex flex-col gap-2">
                                {company.map(({ href, title }, i) => (
                                    <a
                                        key={i}
                                        className="text-sm text-white/60 transition-colors hover:text-white"
                                        href={href}
                                    >
                                        {title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Social links — centered */}
                    <div className="flex gap-3">
                        {socialLinks.map((item, i) => (
                            <a
                                key={i}
                                className="rounded-lg border p-2.5 text-white/50 transition-all duration-200 hover:border-white/30 hover:text-white"
                                style={{
                                    borderColor: 'rgba(255,255,255,0.12)',
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                                href={item.link}
                                title={item.label}
                            >
                                {item.icon}
                            </a>
                        ))}
                    </div>

                    {/* Divider */}
                    <div
                        className="h-px w-12"
                        style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
                    />

                    {/* Copyright — centered */}
                    <p
                        className="text-center text-sm font-light"
                        style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                        © {year} Intervise. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
