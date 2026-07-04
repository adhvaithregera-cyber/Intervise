'use client';

import { Heart } from 'lucide-react';

export function MinimalFooter() {
    const year = new Date().getFullYear();

    const footerLinks = [
        {
            section: 'Resources',
            links: [
                { title: 'Documentation', href: '#' },
                { title: 'Help Center', href: '#' },
                { title: 'Contact Support', href: '#' },
                { title: 'FAQ', href: '#' },
                { title: 'Community', href: '#' },
            ],
        },
        {
            section: 'Company',
            links: [
                { title: 'About Intervise', href: '#' },
                { title: 'Careers', href: '#' },
                { title: 'Blog', href: '#' },
                { title: 'Privacy Policy', href: '#' },
                { title: 'Terms of Service', href: '#' },
            ],
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
        <footer className="relative mt-24 w-full border-t border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
                {/* Top section: About + Social */}
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
                    {/* Brand */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-white uppercase">
                                Intervise
                            </h3>
                            <p className="mt-2 text-sm text-white/60">
                                Master interview skills with AI-powered coaching. Practice, get feedback, and ace your next interview.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {socialLinks.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={item.label}
                                    className="rounded-lg border border-white/15 p-2.5 text-white/50 transition-all hover:border-white/35 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125]"
                                    aria-label={`Follow us on ${item.label}`}
                                >
                                    {item.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="grid grid-cols-2 gap-8 md:col-span-2">
                        {footerLinks.map((section, i) => (
                            <div key={i}>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-4">
                                    {section.section}
                                </h4>
                                <ul className="space-y-3">
                                    {section.links.map((link, j) => (
                                        <li key={j}>
                                            <a
                                                href={link.href}
                                                className="text-sm text-white/60 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125] focus-visible:rounded px-1"
                                            >
                                                {link.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <hr className="my-12 border-white/10" />

                {/* Bottom: Copyright + Legal */}
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-white/50 text-center sm:text-left">
                        © {year} Intervise. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a
                            href="#privacy"
                            className="text-sm text-white/50 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125] focus-visible:rounded px-1"
                        >
                            Privacy
                        </a>
                        <a
                            href="#terms"
                            className="text-sm text-white/50 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125] focus-visible:rounded px-1"
                        >
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
