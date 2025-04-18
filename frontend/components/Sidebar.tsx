"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    HomeIcon,
    FolderIcon,
    DocumentTextIcon,
    ChartBarIcon,
    CommandLineIcon,
    LightBulbIcon,
    BookOpenIcon,
    DocumentDuplicateIcon,
    ChartPieIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    DocumentCheckIcon,
    ClipboardDocumentListIcon,
    RocketLaunchIcon,
    BuildingOfficeIcon,
    MagnifyingGlassIcon,
    PresentationChartLineIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

interface NavItem {
    name: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    isProjectRoute?: boolean;
}

interface NavSection {
    name: string;
    items: NavItem[];
}

const navigation: NavSection[] = [
    {
        name: 'Overview',
        items: [
            {
                name: 'Dashboard',
                path: '/dashboard',
                icon: HomeIcon
            }
        ]
    },
    {
        name: 'Projects',
        items: [
            {
                name: 'Active Projects',
                path: '/projects/active',
                icon: FolderIcon
            },
            {
                name: 'Project Templates',
                path: '/projects/templates',
                icon: DocumentDuplicateIcon
            },
            {
                name: 'Project Archive',
                path: '/projects/archive',
                icon: DocumentCheckIcon
            }
        ]
    },
    {
        name: 'Workflows',
        items: [
            {
                name: 'Discovery',
                path: '/workflows/discovery',
                icon: MagnifyingGlassIcon
            },
            {
                name: 'Analysis',
                path: '/workflows/analysis',
                icon: ChartPieIcon
            },
            {
                name: 'Solution Development',
                path: '/workflows/solution',
                icon: RocketLaunchIcon
            },
            {
                name: 'Implementation',
                path: '/workflows/implementation',
                icon: ClipboardDocumentCheckIcon
            }
        ]
    },
    {
        name: 'AI Tools',
        items: [
            {
                name: 'Case Solver',
                path: '/business-case',
                icon: BuildingOfficeIcon
            },
            {
                name: 'Market Research',
                path: '/market-research',
                icon: ChartBarIcon
            },
            {
                name: 'Research Assistant',
                path: '/multi-agent',
                icon: PresentationChartLineIcon
            },
            {
                name: 'Consultant',
                path: '/consultant',
                icon: UserGroupIcon
            }
        ]
    },
    {
        name: 'Resources',
        items: [
            {
                name: 'Knowledge Base',
                path: '/resources/knowledge',
                icon: BookOpenIcon
            },
            {
                name: 'Templates',
                path: '/resources/templates',
                icon: DocumentDuplicateIcon
            },
            {
                name: 'Reports',
                path: '/resources/reports',
                icon: DocumentTextIcon
            }
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    
    // Extract project ID from pathname if we're in a project route
    const projectId = pathname?.split('/')[2];
    const isProjectRoute = pathname?.startsWith('/projects/') && projectId !== 'active' && projectId !== 'templates' && projectId !== 'archive';

    // Get the current active project ID from the pathname
    const currentProjectId = isProjectRoute ? projectId : null;

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
                            {section.items.map((item) => {
                                // For project routes, we need to handle the navigation differently
                                if (item.isProjectRoute) {
                                    // If we're not in a project context, link to the active projects page
                                    if (!currentProjectId) {
                                        return (
                                            <Link
                                                key={item.path}
                                                href="/projects/active"
                                                className={`nav-item ${pathname === '/projects/active' ? 'active' : ''}`}
                                            >
                                                <div className="nav-content">
                                                    <div className="icon-wrapper">
                                                        <item.icon className="nav-icon" />
                                                    </div>
                                                    <span className="nav-name">{item.name}</span>
                                                </div>
                                            </Link>
                                        );
                                    }

                                    // If we are in a project context, use the current project ID
                                    const href = item.path.replace('[id]', currentProjectId);
                                    return (
                                        <Link
                                            key={item.path}
                                            href={href}
                                            className={`nav-item ${pathname === href ? 'active' : ''}`}
                                        >
                                            <div className="nav-content">
                                                <div className="icon-wrapper">
                                                    <item.icon className="nav-icon" />
                                                </div>
                                                <span className="nav-name">{item.name}</span>
                                            </div>
                                        </Link>
                                    );
                                }

                                // For non-project routes, use the path as is
                                return (
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
                                );
                            })}
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
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    border-bottom: 1px solid #f3f4f6;
                    height: 64px;
                    background: #ffffff;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 1rem 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .nav-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .section-title {
                    padding: 0 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #6b7280;
                    letter-spacing: 0.05em;
                }

                .section-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    padding: 0 1.5rem;
                }

                .nav-item {
                    display: block;
                    padding: 0.5rem 0;
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
                    left: -1.5rem;
                    top: 0;
                    height: 100%;
                    width: 3px;
                    background: #3b82f6;
                    border-radius: 0 4px 4px 0;
                }

                .nav-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    height: 28px;
                }

                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    flex-shrink: 0;
                    background: #f9fafb;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .nav-item:hover .icon-wrapper {
                    background: #f3f4f6;
                }

                .nav-item.active .icon-wrapper {
                    background: #e5e7eb;
                }

                .nav-icon {
                    width: 16px;
                    height: 16px;
                    color: currentColor;
                }

                .nav-name {
                    font-weight: 500;
                    font-size: 0.875rem;
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