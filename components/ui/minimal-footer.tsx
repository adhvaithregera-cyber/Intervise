'use client';

import {
    Lightbulb,
    Heart,
} from 'lucide-react';

export function MinimalFooter() {
    const year = new Date().getFullYear();

    const company = [
        {
            title: 'About Intervise',
            href: '#',
        },
        {
            title: 'Careers',
            href: '#',
        },
        {
            title: 'Blog',
            href: '#',
        },
        {
            title: 'Privacy Policy',
            href: '#',
        },
        {
            title: 'Terms of Service',
            href: '#',
        },
    ];

    const resources = [
        {
            title: 'Documentation',
            href: '#',
        },
        {
            title: 'Help Center',
            href: '#',
        },
        {
            title: 'Contact Support',
            href: '#',
        },
        {
            title: 'FAQ',
            href: '#',
        },
        {
            title: 'Community',
            href: '#',
        },
    ];

    const socialLinks = [
        {
            icon: <Heart className="size-4" />,
            link: 'https://www.instagram.com/intervisehq/',
            label: 'Instagram',
        },
    ];

    return (
        <footer className="relative mt-20 w-full">
            <div
                className="mx-auto max-w-7xl border-t border-b"
                style={{ borderColor: 'rgba(249,193,37,0.15)' }}
            >
                {/* Top divider */}
                <div
                    className="absolute inset-x-0 h-px w-full"
                    style={{ backgroundColor: 'rgba(249,193,37,0.08)' }}
                />

                {/* Main footer content */}
                <div className="grid max-w-7xl grid-cols-6 gap-6 p-8 md:p-12">
                    {/* Brand section */}
                    <div className="col-span-6 flex flex-col gap-6 md:col-span-2">
                        <a href="/" className="w-max">
                            <div
                                className="flex items-center gap-2 rounded-lg p-2"
                                style={{ backgroundColor: 'rgba(249,193,37,0.10)' }}
                            >
                                <Lightbulb
                                    className="size-6"
                                    style={{ color: '#F9C125' }}
                                />
                                <span
                                    className="text-lg font-bold"
                                    style={{ color: '#F9C125' }}
                                >
                                    Intervise
                                </span>
                            </div>
                        </a>
                        <p
                            className="font-mono text-sm text-balance max-w-sm"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            Master interview skills with AI-powered coaching. Practice, get feedback, and ace your next interview.
                        </p>
                        {/* Social links */}
                        <div className="flex gap-3">
                            {socialLinks.map((item, i) => (
                                <a
                                    key={i}
                                    className="transition-all duration-200 rounded-lg p-2.5"
                                    style={{
                                        backgroundColor: 'rgba(249,193,37,0.10)',
                                        border: '1px solid rgba(249,193,37,0.20)',
                                        color: '#F9C125',
                                    }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={item.link}
                                    title={item.label}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor =
                                            'rgba(249,193,37,0.20)';
                                        (e.currentTarget as HTMLElement).style.boxShadow =
                                            '0 0 16px rgba(249,193,37,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor =
                                            'rgba(249,193,37,0.10)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    }}
                                >
                                    {item.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Resources column */}
                    <div className="col-span-3 w-full md:col-span-2">
                        <span
                            className="mb-4 block text-xs font-semibold uppercase tracking-widest"
                            style={{ color: '#F9C125' }}
                        >
                            Resources
                        </span>
                        <div className="flex flex-col gap-3">
                            {resources.map(({ href, title }, i) => (
                                <a
                                    key={i}
                                    className="text-sm transition-all duration-200 hover:opacity-100"
                                    style={{
                                        color: 'rgba(255,255,255,0.70)',
                                    }}
                                    href={href}
                                >
                                    {title}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company column */}
                    <div className="col-span-3 w-full md:col-span-2">
                        <span
                            className="mb-4 block text-xs font-semibold uppercase tracking-widest"
                            style={{ color: '#F9C125' }}
                        >
                            Company
                        </span>
                        <div className="flex flex-col gap-3">
                            {company.map(({ href, title }, i) => (
                                <a
                                    key={i}
                                    className="text-sm transition-all duration-200 hover:opacity-100"
                                    style={{
                                        color: 'rgba(255,255,255,0.70)',
                                    }}
                                    href={href}
                                >
                                    {title}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom divider */}
                <div
                    className="absolute inset-x-0 h-px w-full"
                    style={{ backgroundColor: 'rgba(249,193,37,0.08)' }}
                />

                {/* Copyright */}
                <div className="flex max-w-7xl flex-col justify-between gap-4 px-8 py-6 md:px-12 md:py-8">
                    <p
                        className="text-center text-sm font-light"
                        style={{ color: 'rgba(255,255,255,0.50)' }}
                    >
                        © {year} Intervise. All rights reserved.{' '}
                        <a
                            href="https://intervise.in"
                            className="transition-colors duration-200"
                            style={{ color: '#F9C125' }}
                        >
                            Learn more
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
