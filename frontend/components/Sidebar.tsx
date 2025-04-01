"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ChatBubbleLeftRightIcon,
    ChartBarIcon,
    ChartBarSquareIcon,
    CommandLineIcon,
    DocumentTextIcon,
    FolderIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';

interface NavItem {
    name: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navigation = [
    {
        name: 'AI Tools',
        items: [
            {
                name: 'Consultant',
                path: '/consultant',
                icon: ChatBubbleLeftRightIcon
            },
            {
                name: 'Market Research',
                path: '/market-research',
                icon: ChartBarIcon
            },
            {
                name: 'Case Solver',
                path: '/business-case',
                icon: ChartBarSquareIcon
            },
            {
                name: 'Research Assistant',
                path: '/multi-agent',
                icon: CommandLineIcon
            }
        ]
    },
    {
        name: 'Resources',
        items: [
            {
                name: 'Reports',
                path: '/reports',
                icon: DocumentTextIcon
            },
            {
                name: 'Insights',
                path: '/insights',
                icon: LightBulbIcon
            }
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={40}
                        priority
                    />
                </div>
            </div>

            <nav className="sidebar-nav">
                {navigation.map((section) => (
                    <div key={section.name} className="nav-section">
                        <h2 className="section-title">{section.name}</h2>
                        <div className="section-items">
                            {section.items.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                                >
                                    <div className="nav-content">
                                        <div className="icon-wrapper">
                                            <item.icon className="nav-icon" />
                                        </div>
                                        <span className="nav-name">{item.name}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <style jsx>{`
                .sidebar {
                    width: 260px;
                    height: 100vh;
                    background: #ffffff;
                    border-right: 1px solid #e5e7eb;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .sidebar-header {
                    padding: 1.75rem 2rem;
                    display: flex;
                    align-items: center;
                    border-bottom: 1px solid #f3f4f6;
                    height: 80px;
                    background: #ffffff;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 2.5rem 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2.5rem;
                }

                .nav-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .section-title {
                    padding: 0 2rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #6b7280;
                    letter-spacing: 0.05em;
                }

                .section-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding: 0 2rem;
                }

                .nav-item {
                    display: block;
                    padding: 0.875rem 0;
                    color: #4b5563;
                    text-decoration: none;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                    position: relative;
                }

                .nav-item:hover {
                    background: #f9fafb;
                    color: #1f2937;
                }

                .nav-item.active {
                    background: #f3f4f6;
                    color: #1f2937;
                    border-left-color: #3b82f6;
                }

                .nav-item.active::before {
                    content: '';
                    position: absolute;
                    left: -2rem;
                    top: 0;
                    height: 100%;
                    width: 3px;
                    background: #3b82f6;
                    border-radius: 0 4px 4px 0;
                }

                .nav-content {
                    display: flex;
                    align-items: center;
                    gap: 1.75rem;
                    height: 32px;
                }

                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    flex-shrink: 0;
                    background: #f9fafb;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .nav-item:hover .icon-wrapper {
                    background: #f3f4f6;
                }

                .nav-item.active .icon-wrapper {
                    background: #e5e7eb;
                }

                .nav-icon {
                    width: 18px;
                    height: 18px;
                    color: currentColor;
                }

                .nav-name {
                    font-weight: 500;
                    font-size: 0.9375rem;
                    line-height: 1.25rem;
                }

                @media (max-width: 768px) {
                    .sidebar {
                        transform: translateX(-100%);
                    }
                }
            `}</style>
        </div>
    );
} 