import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ResearchResult, Audience, ChartDataItem, DiscoveredAudience, ComparisonChartDataItem } from './types';
import { fetchMarketResearch, fetchAudienceResearch, fetchChartData, discoverAudiences, fetchCampaignIdeas, fetchAudienceChatResponse, fetchAudienceComparison, fetchComparisonChartData } from './services/geminiService';
import { addAudience, getAudiences, getAudience, updateAudience, deleteAudience } from './services/localStorageService';
import type { Chart } from 'chart.js';

// --- Icon Components ---
const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" /></svg>
);
const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
);
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);


// --- UI Helper Components ---
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => (
  <div className={`flex justify-center items-center ${size === 'md' ? 'p-8' : 'p-2'}`}>
    <div style={{ borderColor: 'var(--accent-color)', borderBottomColor: 'transparent' }} className={`animate-spin rounded-full border-2 ${size === 'md' ? 'h-12 w-12' : 'h-6 w-6'}`}></div>
  </div>
);
const ErrorDisplay: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return (
        <div style={{ backgroundColor: 'var(--danger-red-bg)', borderColor: 'var(--danger-red)', color: 'var(--danger-red)' }} className="border px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{message}</span>
        </div>
    );
};
const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        style={{
            borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        }}
        className={`nav-tab ${isActive ? 'active' : ''} flex items-center whitespace-nowrap py-4 px-4 text-sm font-medium transition-all duration-200 focus:outline-none border-b-2 hover:text-[var(--text-primary)]`}
    >
        {children}
    </button>
);
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="relative w-full max-w-2xl rounded-lg shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)'}}>
                    <h3 id="modal-title" className="text-xl font-semibold" style={{ color: 'var(--text-primary)'}}>{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors" aria-label="Close modal">
                       <XIcon className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
            <div className="relative w-full max-w-md rounded-lg shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--danger-red-bg)' }}>
                        <TrashIcon className="h-6 w-6" style={{ color: 'var(--danger-red)' }} />
                    </div>
                    <h3 id="confirmation-modal-title" className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)'}}>{title}</h3>
                    <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)'}}>
                        {children}
                    </div>
                </div>
                <div className="gap-3 flex justify-end p-4 border-t bg-slate-50 rounded-b-lg" style={{ borderColor: 'var(--border-color)'}}>
                     <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium rounded-md border shadow-sm hover:bg-slate-100 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} type="button" className="px-4 py-2 text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--danger-red)' }}>
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- View Components ---

type View = 'list' | 'create' | 'dashboard';
type Feature = 'audiences' | 'market' | 'charts' | 'discover' | 'campaigns' | 'compare';

const commonCardClasses = "p-6 sm:p-8 rounded-lg shadow-lg border";
const commonInputClasses = "w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition duration-200";
const primaryButtonClasses = "inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] disabled:cursor-not-allowed transition-colors duration-200 hover:bg-[var(--accent-color-hover)]";

// Feature 1: Market Research View
const MarketResearchView: React.FC = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResearchResult | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await fetchMarketResearch(query);
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className={commonCardClasses} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>Synapse Insight</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Enter a query to get an AI-powered market analysis with sources.</p>
                </div>
                <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., Market size for electric scooters in India"
                            className={commonInputClasses}
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !query.trim()} className={primaryButtonClasses} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', '--tw-ring-offset-color': 'var(--bg-main)' } as React.CSSProperties}>
                           {loading ? 'Researching...' : 'Research'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-8">
                {loading && <LoadingSpinner />}
                <ErrorDisplay message={error} />
                {result && (
                    <div className={`animate-fade-in space-y-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                         <div className="prose-custom max-w-none space-y-4" dangerouslySetInnerHTML={{ __html: result.answer }} />
                        {result.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)'}}>Sources</h3>
                                <ul className="space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)' }}>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


// Feature 2, Part 1: Audiences List View
interface AudiencesListViewProps {
    setView: (view: View) => void;
    setCurrentAudienceId: (id: string) => void;
    audiences: Audience[];
    error: string | null;
    onEdit: (id: string) => void;
    onRequestDelete: (id: string) => void;
    onStartCreate: () => void;
}

const AudiencesListView: React.FC<AudiencesListViewProps> = ({ 
    setView, 
    setCurrentAudienceId, 
    audiences, 
    error,
    onEdit, 
    onRequestDelete, 
    onStartCreate 
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAudiences = useMemo(() =>
        audiences.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [audiences, searchTerm]
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>Audiences</h1>
                <button onClick={onStartCreate} className={`inline-flex items-center justify-center px-5 py-2.5 font-semibold rounded-lg shadow-md transition-colors duration-200 ${primaryButtonClasses}`} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)'}}>
                    <i data-lucide="plus" className="icon !mr-2 -ml-1" style={{ color: 'var(--text-on-accent)' }}></i>
                    Create new audience
                </button>
            </header>

            <ErrorDisplay message={error} />
            
            {audiences.length === 0 && !error ? (
                <div className="text-center p-16 border-2 border-dashed rounded-lg mt-8 bg-white" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex justify-center mb-4">
                      <i data-lucide="folder-search-2" className="w-16 h-16" style={{ color: 'var(--border-color)' }}></i>
                    </div>
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No audiences yet</h3>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Click 'Create new audience' to get started.</p>
                </div>
            ) : (
                <>
                    <div className="mb-2">
                        <div className="relative max-w-sm">
                            <i data-lucide="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 icon !m-0" />
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="Search audiences..." 
                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2" 
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent-color)'} as React.CSSProperties} 
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                        <div className="col-span-6">Name</div>
                        <div className="col-span-3">Date Created</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>
                    
                    <div className="space-y-3">
                        {filteredAudiences.length > 0 ? (
                            filteredAudiences.map(audience => (
                                <div key={audience.id} className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg shadow-sm border bg-white group transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-px" style={{ borderColor: 'var(--border-color)' }}>
                                    <div onClick={() => { setCurrentAudienceId(audience.id); setView('dashboard'); }} className="col-span-6 font-medium cursor-pointer" style={{ color: 'var(--text-primary)'}}>
                                        {audience.name}
                                    </div>
                                    <div className="col-span-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(audience.createdAt)}</div>
                                    <div className="col-span-3 flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(audience.id)} className="p-2 rounded-md hover:bg-slate-100" title="Edit Audience">
                                            <i data-lucide="pencil" className="h-4 w-4 text-slate-500"></i>
                                        </button>
                                        <button onClick={() => onRequestDelete(audience.id)} className="p-2 rounded-md hover:bg-slate-100" title="Delete Audience">
                                            <i data-lucide="trash-2" className="h-4 w-4 text-slate-500"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="text-center p-8 bg-white rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>No audiences match your search term.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};


// Feature 2, Part 2: Audience Form View
const AudienceFormView: React.FC<{ setView: (view: View) => void; onAudienceSaved: () => void; audienceIdToEdit: string | null; }> = ({ setView, onAudienceSaved, audienceIdToEdit }) => {
    const [name, setName] = useState('');
    const [demographics, setDemographics] = useState('');
    const [interests, setInterests] = useState('');
    const [behaviors, setBehaviors] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditMode = !!audienceIdToEdit;

    useEffect(() => {
        if (isEditMode) {
            try {
                const audience = getAudience(audienceIdToEdit);
                if (audience) {
                    setName(audience.name);
                    setDemographics(audience.demographics);
                    setInterests(audience.interests);
                    setBehaviors(audience.behaviors);
                } else {
                    setError(`Audience with ID ${audienceIdToEdit} not found.`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load audience data.');
            }
        } else {
            // Reset form for create mode
            setName('');
            setDemographics('');
            setInterests('');
            setBehaviors('');
            setError(null);
        }
    }, [audienceIdToEdit]);

    const isSubmittable = name.trim() !== '' && (demographics.trim() !== '' || interests.trim() !== '' || behaviors.trim() !== '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSubmittable || isSaving) return;

        setIsSaving(true);
        setError(null);

        try {
            const audienceData = { name, demographics, interests, behaviors };
            if (isEditMode) {
                updateAudience(audienceIdToEdit, audienceData);
            } else {
                addAudience(audienceData);
            }
            onAudienceSaved();
            setView('list');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save audience.');
            setIsSaving(false);
        }
    };
    
    const formInputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
    const labelClasses = "block text-sm font-medium mb-2";

    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>{isEditMode ? 'Edit Audience' : 'Create New Audience'}</h2>
                <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Define your target group to save it for later analysis.</p>
            </div>
            <form onSubmit={handleSave} className={`space-y-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                 <div>
                    <label htmlFor="audienceName" className={labelClasses} style={{ color: 'var(--text-secondary)'}}>Audience Name</label>
                    <input id="audienceName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Fitness Fans on TikTok" className={commonInputClasses} style={formInputStyle} disabled={isSaving} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="demographics" className={labelClasses} style={{ color: 'var(--text-secondary)'}}>Demographics</label>
                        <textarea id="demographics" value={demographics} onChange={e => setDemographics(e.target.value)} placeholder="Age 18-25, living in metro cities in India" rows={4} className={commonInputClasses} style={formInputStyle} disabled={isSaving}></textarea>
                    </div>
                    <div>
                        <label htmlFor="interests" className={labelClasses} style={{ color: 'var(--text-secondary)'}}>Interests & Hobbies</label>
                        <textarea id="interests" value={interests} onChange={e => setInterests(e.target.value)} placeholder="Interested in sustainable fashion, follows finance influencers" rows={4} className={commonInputClasses} style={formInputStyle} disabled={isSaving}></textarea>
                    </div>
                    <div>
                        <label htmlFor="behaviors" className={labelClasses} style={{ color: 'var(--text-secondary)'}}>Behaviors</label>
                        <textarea id="behaviors" value={behaviors} onChange={e => setBehaviors(e.target.value)} placeholder="Shops online, uses UPI for payments" rows={4} className={commonInputClasses} style={formInputStyle} disabled={isSaving}></textarea>
                    </div>
                </div>
                <ErrorDisplay message={error} />
                <div className="flex justify-between items-center">
                    <button type="button" onClick={() => setView('list')} className="text-sm font-medium hover:text-[var(--text-dark-blue)] transition-colors" style={{ color: 'var(--text-secondary)'}}>Cancel</button>
                    <button type="submit" disabled={isSaving || !isSubmittable} className={primaryButtonClasses} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', '--tw-ring-offset-color': 'var(--bg-main)' } as React.CSSProperties}>
                        {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Audience' : 'Save Audience')}
                    </button>
                </div>
            </form>
        </div>
    );
};


// Feature 2, Part 3: Audience Dashboard View
const DASHBOARD_WIDGETS = [
    { id: 'characteristics', title: 'Key Characteristics & Concerns', question: 'What are the key characteristics and primary concerns of this audience?' },
    { id: 'social', title: 'Social Media Usage', question: 'What social media platforms do they use most, and for what purposes?' },
    { id: 'purchasing', title: 'Online Purchasing Habits', question: 'Describe their online purchasing habits, including preferred product categories and payment methods.' },
    { id: 'news', title: 'Primary News & Information Sources', question: 'What are their primary sources for news and information?' },
];

interface ChatMessage {
    sender: 'user' | 'audience';
    message: string;
}

const AudienceDashboardView: React.FC<{ audienceId: string; setView: (view: View) => void; }> = ({ audienceId, setView }) => {
    const [audience, setAudience] = useState<Audience | null>(null);
    const [widgetResults, setWidgetResults] = useState<Record<string, ResearchResult>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userMessage, setUserMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const fetchAndAnalyze = async () => {
            try {
                setError(null);
                
                const fetchedAudience = getAudience(audienceId);
                if (!fetchedAudience) {
                    throw new Error("Audience not found.");
                }
                setAudience(fetchedAudience);

                setLoadingStates(DASHBOARD_WIDGETS.reduce((acc, w) => ({ ...acc, [w.id]: true }), {}));

                const audienceProfile = `The target audience is defined by: Demographics: ${fetchedAudience.demographics}. Interests & Hobbies: ${fetchedAudience.interests}. Behaviors: ${fetchedAudience.behaviors}.`;

                await Promise.all(DASHBOARD_WIDGETS.map(async (widget) => {
                    const finalPrompt = `Based on the following audience profile, please answer the question.\n\nProfile: ${audienceProfile}\n\nQuestion: ${widget.question}`;
                    try {
                        const data = await fetchAudienceResearch(finalPrompt);
                        setWidgetResults(prev => ({ ...prev, [widget.id]: data }));
                    } catch (widgetError) {
                        console.error(`Error fetching data for widget ${widget.title}:`, widgetError);
                         setWidgetResults(prev => ({ ...prev, [widget.id]: { answer: `<p>Failed to load data for this section.</p>`, sources: [] } }));
                    } finally {
                        setLoadingStates(prev => ({ ...prev, [widget.id]: false }));
                    }
                }));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load audience dashboard.');
                setLoadingStates({});
            }
        };

        fetchAndAnalyze();
    }, [audienceId]);
    
    useEffect(() => {
        // Auto-scroll to the bottom of the chat window
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isChatLoading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userMessage.trim() || isChatLoading || !audience) return;

        const currentMessage = userMessage.trim();
        setChatHistory(prev => [...prev, { sender: 'user', message: currentMessage }]);
        setUserMessage('');
        setIsChatLoading(true);
        setChatError(null);

        try {
            const audienceProfile = `Demographics: ${audience.demographics}. Interests & Hobbies: ${audience.interests}. Behaviors: ${audience.behaviors}.`;
            const result = await fetchAudienceChatResponse(audienceProfile, currentMessage);
            setChatHistory(prev => [...prev, { sender: 'audience', message: result.answer }]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setChatError(errorMessage);
            setChatHistory(prev => [...prev, { sender: 'audience', message: `Sorry, I encountered an error: ${errorMessage}` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
             <button onClick={() => setView('list')} className="inline-flex items-center text-sm font-medium hover:text-[var(--text-dark-blue)] transition-colors" style={{ color: 'var(--text-secondary)'}}>
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to all audiences
            </button>
            
            <div className="text-center">
                <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>{audience ? audience.name : 'Loading Audience...'}</h2>
                <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>An AI-generated report based on your audience definition.</p>
            </div>

            <ErrorDisplay message={error} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {DASHBOARD_WIDGETS.map(widget => (
                    <div key={widget.id} className={commonCardClasses} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)'}}>{widget.title}</h3>
                        {loadingStates[widget.id] ? <LoadingSpinner size="sm" /> : (
                            <div className="space-y-4">
                                <div className="prose-custom max-w-none space-y-3 text-sm" dangerouslySetInnerHTML={{ __html: widgetResults[widget.id]?.answer || "" }} />
                                {widgetResults[widget.id]?.sources.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase mt-4 mb-2" style={{ color: 'var(--text-secondary)'}}>Sources</h4>
                                        <ul className="space-y-2">
                                            {widgetResults[widget.id].sources.map((source, index) => (
                                                <li key={index} className="flex items-start text-xs">
                                                    <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)'}}>
                                                        {source.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={`mt-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)'}}>Chat with this Audience</h3>
                <div className="flex flex-col h-96">
                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-4 space-y-4">
                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-md p-3 rounded-lg prose-custom text-sm ${chat.sender === 'user' ? 'text-white' : ''}`}
                                    style={{ backgroundColor: chat.sender === 'user' ? 'var(--accent-color)' : '#e5e7eb' }}
                                    dangerouslySetInnerHTML={{ __html: chat.message }}
                                >
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-md p-3 rounded-lg" style={{ backgroundColor: '#e5e7eb' }}>
                                    <div className="flex items-center space-x-1">
                                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <ErrorDisplay message={chatError} />
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={userMessage}
                                onChange={e => setUserMessage(e.target.value)}
                                placeholder="Ask a follow-up question..."
                                className={commonInputClasses}
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
                                disabled={isChatLoading}
                            />
                            <button type="submit" disabled={isChatLoading || !userMessage.trim()} className="p-3 rounded-lg shadow-sm transition-colors duration-200" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}>
                                <SendIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    );
};

// Feature 3: Charts View
const ChartsView: React.FC = () => {
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [selectedAudienceId, setSelectedAudienceId] = useState<string>('');
    const [selectedAudienceBId, setSelectedAudienceBId] = useState<string>('');
    const [chartTopic, setChartTopic] = useState('');
    const [chartType, setChartType] = useState<'vertical-bar' | 'horizontal-bar' | 'table'>('vertical-bar');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartResult, setChartResult] = useState<{ data: ChartDataItem[] | ComparisonChartDataItem[], sources: { title: string, uri: string }[] } | null>(null);

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ResearchResult | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const fetchedAudiences = getAudiences();
            setAudiences(fetchedAudiences);
            if (fetchedAudiences.length > 0) {
                setSelectedAudienceId(fetchedAudiences[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audiences.');
        }
    }, []);

    const handleGenerateChart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAudienceId || !chartTopic.trim() || loading) return;

        if (selectedAudienceBId && selectedAudienceId === selectedAudienceBId) {
            setError("Please select two different audiences to compare.");
            return;
        }

        setLoading(true);
        setError(null);
        setChartResult(null);

        try {
             // NEW: Comparative logic
            if (selectedAudienceBId) {
                const audienceA = getAudience(selectedAudienceId);
                const audienceB = getAudience(selectedAudienceBId);
                if (!audienceA || !audienceB) throw new Error("One or both selected audiences not found.");

                const profileA = `Demographics: ${audienceA.demographics}. Interests & Hobbies: ${audienceA.interests}. Behaviors: ${audienceA.behaviors}.`;
                const profileB = `Demographics: ${audienceB.demographics}. Interests & Hobbies: ${audienceB.interests}. Behaviors: ${audienceB.behaviors}.`;
                const finalPrompt = `Please generate comparison data for the topic: '${chartTopic}' for the following two audiences. Audience A: '${profileA}'. Audience B: '${profileB}'.`;
                
                const result = await fetchComparisonChartData(finalPrompt);
                setChartResult(result);

            } else { // EXISTING: Single audience logic
                const audience = getAudience(selectedAudienceId);
                if (!audience) throw new Error("Selected audience not found.");

                const audienceProfile = `The target audience is defined by: Demographics: ${audience.demographics}. Interests & Hobbies: ${audience.interests}. Behaviors: ${audience.behaviors}.`;
                const finalPrompt = `For the audience "${audience.name}" defined by the profile: "${audienceProfile}", generate data for the following topic: "${chartTopic}"`;

                const result = await fetchChartData(finalPrompt);
                setChartResult(result);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChartClick = async (label: string) => {
        if (!selectedAudienceId || !chartTopic.trim()) return;

        const audience = getAudience(selectedAudienceId);
        if (!audience) {
            setModalError("Could not find the selected audience to generate details.");
            return;
        }

        setModalTitle(`Detailed Insights for "${label}"`);
        setIsModalOpen(true);
        setIsModalLoading(true);
        setModalContent(null);
        setModalError(null);

        try {
            const audienceProfile = `The target audience is defined by: Demographics: ${audience.demographics}. Interests & Hobbies: ${audience.interests}. Behaviors: ${audience.behaviors}.`;
            const finalPrompt = `For the audience "${audience.name}" defined by the profile: "${audienceProfile}", provide a detailed analysis of their engagement with "${label}" regarding the topic "${chartTopic}".`;
            const result = await fetchAudienceResearch(finalPrompt);
            setModalContent(result);
        } catch (err) {
            setModalError(err instanceof Error ? err.message : 'An unknown error occurred while fetching details.');
        } finally {
            setIsModalLoading(false);
        }
    };

    useEffect(() => {
        if (chartResult && chartRef.current && chartType !== 'table') {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;
            
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-dark-blue').trim();
            const gridColor = 'rgba(27, 73, 101, 0.1)';
            
            const isComparison = chartResult.data.length > 0 && 'audienceA_value' in chartResult.data[0];

            if (isComparison) {
                const comparisonData = chartResult.data as ComparisonChartDataItem[];
                const audienceA = audiences.find(a => a.id === selectedAudienceId);
                const audienceB = audiences.find(a => a.id === selectedAudienceBId);

                const labels = comparisonData.map(item => item.label);
                const dataA = comparisonData.map(item => parseInt(item.audienceA_value.replace(/[^0-9.]/g, ''), 10) || 0);
                const dataB = comparisonData.map(item => parseInt(item.audienceB_value.replace(/[^0-9.]/g, ''), 10) || 0);

                chartInstanceRef.current = new (window as any).Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: audienceA?.name || 'Audience A',
                                data: dataA,
                                backgroundColor: 'var(--primary-teal)',
                                borderColor: 'var(--primary-teal)',
                                borderWidth: 1
                            },
                            {
                                label: audienceB?.name || 'Audience B',
                                data: dataB,
                                backgroundColor: 'var(--primary-blue)',
                                borderColor: 'var(--primary-blue)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        indexAxis: chartType === 'horizontal-bar' ? 'y' : 'x',
                        scales: {
                            x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } }
                        },
                        plugins: { legend: { labels: { color: textColor } } },
                        responsive: true,
                        maintainAspectRatio: false,
                    }
                });
            } else {
                 const singleData = chartResult.data as ChartDataItem[];
                const labels = singleData.map(item => item.label);
                const dataValues = singleData.map(item => parseInt(item.value.replace(/[^0-9.]/g, ''), 10) || 0);
                
                const barColors = ['rgba(98, 182, 203, 0.7)', 'rgba(95, 168, 211, 0.7)', 'rgba(27, 73, 101, 0.7)'];
                const borderColors = ['#62B6CB', '#5FA8D3', '#1B4965'];

                chartInstanceRef.current = new (window as any).Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: chartTopic,
                            data: dataValues,
                            backgroundColor: barColors,
                            borderColor: borderColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: chartType === 'horizontal-bar' ? 'y' : 'x',
                        scales: {
                            x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } }
                        },
                        plugins: { legend: { labels: { color: textColor } } },
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: (event: any, elements: any[]) => {
                            if (elements.length > 0 && chartResult?.data) {
                                const dataIndex = elements[0].index;
                                const clickedLabel = (chartResult.data as ChartDataItem[])[dataIndex].label;
                                handleChartClick(clickedLabel);
                            }
                        },
                        onHover: (event: any, chartElement: any[]) => {
                            const canvas = event.native?.target;
                            if(canvas) {
                                canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
                            }
                        },
                    }
                });
            }
        }
    }, [chartResult, chartType, chartTopic, selectedAudienceId, selectedAudienceBId]);

    const formInputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

    return (
        <div className="animate-fade-in space-y-8">
            <div className={`p-6 sm:p-8 rounded-lg shadow-md ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>Chart Builder</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Visualize data for your custom audiences.</p>
                </div>
                <form onSubmit={handleGenerateChart} className="mt-8 max-w-3xl mx-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="audience-select" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Select Audience</label>
                            <select id="audience-select" value={selectedAudienceId} onChange={e => setSelectedAudienceId(e.target.value)} className={commonInputClasses} style={formInputStyle}>
                               {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                               {audiences.length === 0 && <option disabled>Create an audience first</option>}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="audience-select-b" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Compare with Audience (Optional)</label>
                            <select id="audience-select-b" value={selectedAudienceBId} onChange={e => setSelectedAudienceBId(e.target.value)} className={commonInputClasses} style={formInputStyle} disabled={audiences.length < 2}>
                                <option value="">— Select to compare —</option>
                               {audiences
                                 .filter(a => a.id !== selectedAudienceId)
                                 .map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="chart-topic" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Chart Topic</label>
                        <input type="text" id="chart-topic" value={chartTopic} onChange={e => setChartTopic(e.target.value)} placeholder="e.g., Top 5 social media platforms" className={commonInputClasses} style={formInputStyle} />
                    </div>
                     <div>
                        <label htmlFor="chart-type" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Chart Type</label>
                        <select id="chart-type" value={chartType} onChange={e => setChartType(e.target.value as any)} className={commonInputClasses} style={formInputStyle}>
                            <option value="vertical-bar">Vertical Bar Chart</option>
                            <option value="horizontal-bar">Horizontal Bar Chart</option>
                            <option value="table">Table</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={loading || !selectedAudienceId || !chartTopic.trim()} className={`w-full ${primaryButtonClasses}`} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', '--tw-ring-offset-color': 'var(--bg-main)' } as React.CSSProperties}>
                           {loading ? 'Generating...' : 'Generate Chart'}
                        </button>
                    </div>
                </form>
            </div>
             <div className="mt-8">
                {loading && <LoadingSpinner />}
                <ErrorDisplay message={error} />
                {chartResult && (
                    <div className={`animate-fade-in space-y-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                        {chartType === 'table' ? (
                           (() => {
                                const isComparison = chartResult.data.length > 0 && 'audienceA_value' in chartResult.data[0];
                                const audienceA = audiences.find(a => a.id === selectedAudienceId);
                                const audienceB = audiences.find(a => a.id === selectedAudienceBId);
            
                                return isComparison ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left" style={{ color: 'var(--text-secondary)'}}>
                                            <thead className="text-xs uppercase" style={{ backgroundColor: 'var(--bg-table-header)', color: 'var(--text-dark-blue)' }}>
                                                <tr>
                                                    <th scope="col" className="px-6 py-3">Label</th>
                                                    <th scope="col" className="px-6 py-3">{audienceA?.name || 'Audience A'}</th>
                                                    <th scope="col" className="px-6 py-3">{audienceB?.name || 'Audience B'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(chartResult.data as ComparisonChartDataItem[]).map((item, index) => (
                                                    <tr key={index} className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                                                        <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)'}}>{item.label}</th>
                                                        <td className="px-6 py-4">{item.audienceA_value}</td>
                                                        <td className="px-6 py-4">{item.audienceB_value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left" style={{ color: 'var(--text-secondary)'}}>
                                            <thead className="text-xs uppercase" style={{ backgroundColor: 'var(--bg-table-header)', color: 'var(--text-dark-blue)' }}>
                                                <tr>
                                                    <th scope="col" className="px-6 py-3">Label</th>
                                                    <th scope="col" className="px-6 py-3">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(chartResult.data as ChartDataItem[]).map((item, index) => (
                                                    <tr key={index} className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                                                        <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)'}}>{item.label}</th>
                                                        <td className="px-6 py-4">{item.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()
                        ) : (
                             <div className="relative h-96">
                                <canvas ref={chartRef}></canvas>
                            </div>
                        )}
                        {chartResult.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)'}}>Sources</h3>
                                <ul className="space-y-2">
                                    {chartResult.sources.map((source, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)'}}>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
                {isModalLoading && <LoadingSpinner />}
                <ErrorDisplay message={modalError} />
                {modalContent && (
                    <div className="space-y-6">
                         <div className="prose-custom max-w-none space-y-4" dangerouslySetInnerHTML={{ __html: modalContent.answer }} />
                        {modalContent.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)'}}>Sources</h3>
                                <ul className="space-y-2">
                                    {modalContent.sources.map((source, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)' }}>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

// Feature 4: Discover Audiences View
const DiscoverView: React.FC<{ onAudienceSaved: () => void; }> = ({ onAudienceSaved }) => {
    const [marketQuery, setMarketQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ data: DiscoveredAudience[], sources: { title: string, uri: string }[] } | null>(null);
    const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

    const handleDiscover = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marketQuery.trim() || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setSavedStatus({});

        try {
            const data = await discoverAudiences(marketQuery);
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAudience = (audience: DiscoveredAudience) => {
        try {
            addAudience({
                name: audience.audienceName,
                demographics: audience.description,
                interests: "",
                behaviors: ""
            });
            setSavedStatus(prev => ({ ...prev, [audience.audienceName]: true }));
            onAudienceSaved();
        } catch (err) {
            alert("Failed to save audience.");
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className={commonCardClasses} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>Discover Audience Segments</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Find real-world consumer segments within a given market.</p>
                </div>
                <form onSubmit={handleDiscover} className="mt-8 max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={marketQuery}
                            onChange={(e) => setMarketQuery(e.target.value)}
                            placeholder="e.g., Electric Vehicle market in India"
                            className={commonInputClasses}
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !marketQuery.trim()} className={primaryButtonClasses} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', '--tw-ring-offset-color': 'var(--bg-main)' } as React.CSSProperties}>
                           {loading ? 'Discovering...' : 'Discover Segments'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-8">
                {loading && <LoadingSpinner />}
                <ErrorDisplay message={error} />
                {result && (
                    <div className={`animate-fade-in space-y-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                         <div className="space-y-4">
                            {result.data.map((audience, index) => (
                                <div key={index} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderColor: 'var(--border-color)' }}>
                                    <div>
                                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{audience.audienceName}</h3>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{audience.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSaveAudience(audience)}
                                        disabled={savedStatus[audience.audienceName]}
                                        className="text-sm font-semibold rounded-md px-4 py-1.5 transition-colors duration-200 whitespace-nowrap border border-[var(--primary-teal)] text-[var(--primary-teal)] hover:bg-[var(--primary-teal)] hover:text-[var(--text-on-accent)] disabled:bg-transparent disabled:border-slate-300 disabled:text-slate-400"
                                    >
                                        {savedStatus[audience.audienceName] ? 'Saved!' : 'Save Audience'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {result.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Sources</h3>
                                <ul className="space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)'}}>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Feature 5: Campaigns View
const CampaignsView: React.FC = () => {
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [selectedAudienceId, setSelectedAudienceId] = useState<string>('');
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResearchResult | null>(null);

    useEffect(() => {
        try {
            const fetchedAudiences = getAudiences();
            setAudiences(fetchedAudiences);
            if (fetchedAudiences.length > 0) {
                setSelectedAudienceId(fetchedAudiences[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audiences.');
        }
    }, []);

    const handleGenerateIdeas = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAudienceId || !goal.trim() || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const audience = getAudience(selectedAudienceId);
            if (!audience) throw new Error("Selected audience not found.");

            const audienceProfile = `Demographics: ${audience.demographics}. Interests & Hobbies: ${audience.interests}. Behaviors: ${audience.behaviors}.`;
            const finalPrompt = `Please generate marketing campaign ideas for the following. Audience Profile: ${audienceProfile}. Marketing Goal: ${goal}.`;

            const data = await fetchCampaignIdeas(finalPrompt);
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const formInputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

    return (
        <div className="animate-fade-in space-y-8">
            <div className={`p-6 sm:p-8 rounded-lg shadow-md ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>Marketing Campaign Generator</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Generate creative campaign ideas for your target audience.</p>
                </div>
                <form onSubmit={handleGenerateIdeas} className="mt-8 max-w-3xl mx-auto space-y-4">
                    <div>
                        <label htmlFor="audience-select-campaign" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Select Audience</label>
                        <select id="audience-select-campaign" value={selectedAudienceId} onChange={e => setSelectedAudienceId(e.target.value)} className={commonInputClasses} style={formInputStyle}>
                           {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                           {audiences.length === 0 && <option disabled>No audiences found. Create one first.</option>}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="campaign-goal" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Marketing Goal</label>
                        <input type="text" id="campaign-goal" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g., 'Launch a new moisturizer' or 'Drive app downloads'" className={commonInputClasses} style={formInputStyle} />
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={loading || !selectedAudienceId || !goal.trim()} className={`w-full ${primaryButtonClasses}`} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', '--tw-ring-offset-color': 'var(--bg-main)' } as React.CSSProperties}>
                           {loading ? 'Generating...' : 'Generate Ideas'}
                        </button>
                    </div>
                </form>
            </div>
             <div className="mt-8">
                {loading && <LoadingSpinner />}
                <ErrorDisplay message={error} />
                {result && (
                    <div className={`animate-fade-in space-y-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                        <div className="prose-custom max-w-none space-y-4" dangerouslySetInnerHTML={{ __html: result.answer }} />
                        {result.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)'}}>Sources</h3>
                                <ul className="space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)' }}>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Feature 6: Compare Audiences View
const CompareView: React.FC = () => {
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [selectedAudienceAId, setSelectedAudienceAId] = useState<string>('');
    const [selectedAudienceBId, setSelectedAudienceBId] = useState<string>('');
    const [comparisonQuestion, setComparisonQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResearchResult | null>(null);

    useEffect(() => {
        try {
            const fetchedAudiences = getAudiences();
            setAudiences(fetchedAudiences);
            if (fetchedAudiences.length >= 2) {
                setSelectedAudienceAId(fetchedAudiences[0].id);
                setSelectedAudienceBId(fetchedAudiences[1].id);
            } else if (fetchedAudiences.length === 1) {
                setSelectedAudienceAId(fetchedAudiences[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audiences.');
        }
    }, []);

    const handleGenerateComparison = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!selectedAudienceAId || !selectedAudienceBId || !comparisonQuestion.trim() || loading) {
            return;
        }
        if (selectedAudienceAId === selectedAudienceBId) {
            setError("Please select two different audiences to compare.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const audienceA = getAudience(selectedAudienceAId);
            const audienceB = getAudience(selectedAudienceBId);
            if (!audienceA || !audienceB) throw new Error("One or both selected audiences could not be found.");
            
            const profileA = `Demographics: ${audienceA.demographics}. Interests & Hobbies: ${audienceA.interests}. Behaviors: ${audienceA.behaviors}.`;
            const profileB = `Demographics: ${audienceB.demographics}. Interests & Hobbies: ${audienceB.interests}. Behaviors: ${audienceB.behaviors}.`;

            const finalPrompt = `Please compare the following two audiences on this topic. Audience A Profile: ${profileA}. Audience B Profile: ${profileB}. Comparison Question: ${comparisonQuestion}.`;

            const data = await fetchAudienceComparison(finalPrompt);
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const formInputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

    return (
        <div className="animate-fade-in space-y-8">
            <div className={`p-6 sm:p-8 rounded-lg shadow-md ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)'}}>Compare Audiences</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Generate a side-by-side comparison of two audiences.</p>
                </div>
                <form onSubmit={handleGenerateComparison} className="mt-8 max-w-3xl mx-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="audience-select-a" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Audience A</label>
                            <select id="audience-select-a" value={selectedAudienceAId} onChange={e => setSelectedAudienceAId(e.target.value)} className={commonInputClasses} style={formInputStyle}>
                               {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                               {audiences.length === 0 && <option disabled>No audiences available</option>}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="audience-select-b" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Audience B</label>
                            <select id="audience-select-b" value={selectedAudienceBId} onChange={e => setSelectedAudienceBId(e.target.value)} className={commonInputClasses} style={formInputStyle}>
                               {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                               {audiences.length === 0 && <option disabled>No audiences available</option>}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="comparison-question" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)'}}>Comparison Question</label>
                        <input type="text" id="comparison-question" value={comparisonQuestion} onChange={e => setComparisonQuestion(e.target.value)} placeholder="e.g., 'Compare their preferred social media platforms' or 'Which group is more price-sensitive?'" className={commonInputClasses} style={formInputStyle} />
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={loading || !selectedAudienceAId || !selectedAudienceBId || !comparisonQuestion.trim() || audiences.length < 2} className={`w-full ${primaryButtonClasses}`} style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)', '--tw-ring-offset-color': 'var(--bg-main)' } as React.CSSProperties}>
                           {loading ? 'Comparing...' : 'Generate Comparison'}
                        </button>
                    </div>
                </form>
            </div>
             <div className="mt-8">
                {loading && <LoadingSpinner />}
                <ErrorDisplay message={error} />
                {result && (
                    <div className={`animate-fade-in space-y-6 ${commonCardClasses}`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                        <div className="prose-custom max-w-none space-y-4" dangerouslySetInnerHTML={{ __html: result.answer }} />
                        {result.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)'}}>Sources</h3>
                                <ul className="space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index} className="flex items-start text-sm">
                                            <LinkIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)'}} />
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={source.uri} style={{ color: 'var(--accent-color)' }}>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<Feature>('audiences');
    
    // State for Audiences feature
    const [view, setView] = useState<View>('list');
    const [currentAudienceId, setCurrentAudienceId] = useState<string | null>(null);
    const [audienceVersion, setAudienceVersion] = useState(0);
    const forceRerender = () => setAudienceVersion(v => v + 1);

    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [audiencesError, setAudiencesError] = useState<string | null>(null);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [audienceToDeleteId, setAudienceToDeleteId] = useState<string | null>(null);

    useEffect(() => {
        try {
            setAudiencesError(null);
            const fetchedAudiences = getAudiences();
            setAudiences(fetchedAudiences);
        } catch (err) {
            setAudiencesError(err instanceof Error ? err.message : 'Failed to load audiences.');
        }
    }, [audienceVersion]);

    useEffect(() => {
        if (typeof (window as any).lucide !== 'undefined') {
            (window as any).lucide.createIcons();
        }
    });

    const handleAudienceSaved = () => {
        forceRerender();
        setCurrentAudienceId(null);
    };

    const handleStartCreate = () => {
        setCurrentAudienceId(null);
        setView('create');
    };

    const handleEdit = (id: string) => {
        setCurrentAudienceId(id);
        setView('create');
    };

    const handleRequestDelete = (id: string) => {
        setAudienceToDeleteId(id);
        setIsDeleteModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (!audienceToDeleteId) return;
        try {
            deleteAudience(audienceToDeleteId);
            setAudiences(prev => prev.filter(a => a.id !== audienceToDeleteId));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete audience.');
        } finally {
            setIsDeleteModalOpen(false);
            setAudienceToDeleteId(null);
        }
    };


    const renderAudiencesContent = () => {
        switch (view) {
            case 'create':
                return <AudienceFormView 
                    setView={setView} 
                    onAudienceSaved={handleAudienceSaved} 
                    audienceIdToEdit={currentAudienceId} 
                />;
            case 'dashboard':
                if (currentAudienceId) {
                    return <AudienceDashboardView audienceId={currentAudienceId} setView={setView} />;
                }
                setView('list'); 
                return null;
            case 'list':
            default:
                return <AudiencesListView 
                    setView={setView} 
                    setCurrentAudienceId={setCurrentAudienceId} 
                    audiences={audiences}
                    error={audiencesError}
                    onStartCreate={handleStartCreate}
                    onEdit={handleEdit}
                    onRequestDelete={handleRequestDelete}
                />;
        }
    };
    
    return (
        <div className="min-h-screen font-sans">
            <header className="backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: 'var(--border-color)'}}>
                <nav className="container mx-auto max-w-6xl">
                     <div>
                        <div className="flex items-center">
                            <TabButton isActive={activeFeature === 'audiences'} onClick={() => setActiveFeature('audiences')}>
                                <i data-lucide="users" className="icon"></i>
                                <span>Audiences</span>
                            </TabButton>
                            <TabButton isActive={activeFeature === 'discover'} onClick={() => setActiveFeature('discover')}>
                                <i data-lucide="compass" className="icon"></i>
                                <span>Discover</span>
                            </TabButton>
                            <TabButton isActive={activeFeature === 'compare'} onClick={() => setActiveFeature('compare')}>
                               <i data-lucide="git-compare-arrows" className="icon"></i>
                                <span>Compare</span>
                            </TabButton>
                            <TabButton isActive={activeFeature === 'campaigns'} onClick={() => setActiveFeature('campaigns')}>
                                <i data-lucide="megaphone" className="icon"></i>
                                <span>Campaigns</span>
                            </TabButton>
                            <TabButton isActive={activeFeature === 'charts'} onClick={() => setActiveFeature('charts')}>
                                <i data-lucide="bar-chart-2" className="icon"></i>
                                <span>Charts</span>
                            </TabButton>
                            <TabButton isActive={activeFeature === 'market'} onClick={() => setActiveFeature('market')}>
                                <i data-lucide="brain-circuit" className="icon"></i>
                                <span>Synapse Insight</span>
                            </TabButton>
                        </div>
                     </div>
                </nav>
            </header>
            <main className="container mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
                 {activeFeature === 'audiences' && renderAudiencesContent()}
                 {activeFeature === 'discover' && <DiscoverView onAudienceSaved={forceRerender} />}
                 {activeFeature === 'compare' && <CompareView />}
                 {activeFeature === 'campaigns' && <CampaignsView />}
                 {activeFeature === 'charts' && <ChartsView />}
                 {activeFeature === 'market' && <MarketResearchView />}
            </main>
            <footer className="text-center p-4 mt-8 text-sm" style={{ color: 'var(--text-footer)'}}>
                <p>Powered by Gemini. For educational purposes.</p>
            </footer>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Audience"
            >
                Are you sure you want to delete this audience? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default App;
