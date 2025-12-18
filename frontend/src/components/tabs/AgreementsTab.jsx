import React, { useState, useMemo } from 'react';
import { RefreshCw, FileText, AlertTriangle, Search, Filter, CalendarClock, Download, Plus, CheckCircle2, Check } from 'lucide-react';
import StatCard from '../StatCard';
import ImageLightbox from '../ImageLightbox';
import AgreementFilterModal from '../AgreementFilterModal';

const AgreementsTab = ({ agreements, getTitle, loading, categories, onAddAgreement, setSelectedAgreement, setEditingNoteAgreementId }) => {
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    frequency: 'all',
    hasImages: 'all',
    hasNotice: 'all',
    minCost: '',
    maxCost: ''
  });

  // Parse images from agreement
  const parseImages = (imagesData) => {
    if (!imagesData) return [];
    if (Array.isArray(imagesData)) return imagesData;
    try {
      return JSON.parse(imagesData);
    } catch {
      return [];
    }
  };

  // Filtrera avtal baserat på sökfråga och filter
  const filteredAgreements = useMemo(() => {
    let filtered = [...agreements];

    // Applicera filter
    filtered = filtered.filter(a => {
      // Status filter
      if (filters.status !== 'all' && a.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && a.category !== filters.category) {
        return false;
      }

      // Frequency filter
      if (filters.frequency !== 'all' && a.frequency !== filters.frequency) {
        return false;
      }

      // Has images filter
      if (filters.hasImages !== 'all') {
        const hasImages = parseImages(a.images).length > 0;
        if (filters.hasImages === 'yes' && !hasImages) return false;
        if (filters.hasImages === 'no' && hasImages) return false;
      }

      // Has notice filter
      if (filters.hasNotice !== 'all') {
        const hasNotice = a.notice && a.notice.trim().length > 0;
        if (filters.hasNotice === 'yes' && !hasNotice) return false;
        if (filters.hasNotice === 'no' && hasNotice) return false;
      }

      // Cost range filter
      const cost = parseFloat(a.cost) || 0;
      if (filters.minCost && cost < parseFloat(filters.minCost)) {
        return false;
      }
      if (filters.maxCost && cost > parseFloat(filters.maxCost)) {
        return false;
      }

      return true;
    });

    // Applicera sökfråga
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter(a => {
        // Sök i name
        if (a.name?.toLowerCase().includes(query)) return true;
        
        // Sök i provider
        if (a.provider?.toLowerCase().includes(query)) return true;
        
        // Sök i cost (som sträng)
        if (String(a.cost)?.toLowerCase().includes(query)) return true;
        
        // Sök i category
        if (a.category?.toLowerCase().includes(query)) return true;
        
        // Sök i notice
        if (a.notice?.toLowerCase().includes(query)) return true;
        
        // Sök i id (som sträng)
        if (String(a.id).includes(query)) return true;
        
        // Sök i status
        if (a.status?.toLowerCase().includes(query)) return true;
        
        // Sök i frequency
        if (a.frequency?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    return filtered;
  }, [agreements, searchQuery, filters]);

  const handleImageClick = (e, agreement) => {
    e.stopPropagation(); // Förhindra att öppna drawer
    const images = parseImages(agreement.images);
    if (images && images.length > 0) {
      setLightboxImages(images);
      setLightboxIndex(0);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Download size={16} /> Exportera
          </button>
          <button 
            onClick={onAddAgreement}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus size={16} /> Lägg till Avtal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Fast Månadskostnad" 
          amount="9,543 kr" 
          change="+450 kr" 
          trend="up" 
          icon={<RefreshCw className="text-indigo-500 dark:text-indigo-400" />}
        />
        <StatCard 
          title="Aktiva Avtal" 
          amount="7 st" 
          change="1 uppsagd" 
          trend="down" 
          icon={<FileText className="text-emerald-500 dark:text-emerald-400" />}
        />
        <StatCard 
          title="Att omförhandla (30d)" 
          amount="2 st" 
          change="Kolla nu!" 
          trend="down"
          icon={<AlertTriangle className="text-amber-500 dark:text-amber-400" />}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Sök namn, leverantör, kostnad, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative p-2 border rounded-lg transition-all ${
                Object.values(filters).some(v => v !== 'all' && v !== '')
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
              }`}
              title="Filtrera avtal"
            >
              <Filter size={18} />
              {Object.values(filters).some(v => v !== 'all' && v !== '') && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 dark:bg-indigo-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-4 sm:col-span-3">Tjänst / Leverantör</div>
          <div className="col-span-2 hidden sm:block">Kategori</div>
          <div className="col-span-2 sm:col-span-2">Kostnad</div>
          <div className="col-span-2 hidden sm:block">Nästa Betalning</div>
          <div className="col-span-1 text-center">Notering</div>
          <div className="col-span-1 text-center">Bild</div>
          <div className="col-span-2 sm:col-span-2 text-left">Status</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">Laddar avtal...</div>
          ) : filteredAgreements.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery ? `Inga avtal matchar "${searchQuery}"` : 'Inga avtal hittades'}
            </div>
          ) : (
            filteredAgreements.map(agreement => (
              <div 
                key={agreement.id} 
                onClick={() => setSelectedAgreement(agreement)}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors items-center group cursor-pointer"
              >
                <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
                    {agreement.icon}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">{agreement.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{agreement.provider}</p>
                  </div>
                </div>

                <div className="col-span-2 hidden sm:block">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    {agreement.category}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <p className="font-bold text-zinc-900 dark:text-white">{agreement.cost} kr</p>
                  <p className="text-xs text-zinc-500">{agreement.frequency}</p>
                </div>

                <div className="col-span-2 hidden sm:block">
                  <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CalendarClock size={14} className="text-indigo-500 dark:text-indigo-400" />
                    {(() => {
                      const nextPayment = agreement.next_payment || agreement.nextPayment;
                      if (!nextPayment) return 'Ingen datum';
                      
                      // Formatera datum om det är i ISO-format (YYYY-MM-DD)
                      if (nextPayment.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const date = new Date(nextPayment);
                        return date.toLocaleDateString('sv-SE', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }
                      
                      return nextPayment;
                    })()}
                  </div>
                  {agreement.notice && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{agreement.notice}</p>
                  )}
                </div>

                {/* Notering-kolumn */}
                <div className="col-span-1 flex justify-center">
                  {(() => {
                    const hasNotice = agreement.notice && agreement.notice.trim().length > 0;
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setEditingNoteAgreementId) {
                            setEditingNoteAgreementId(agreement.id);
                          }
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          hasNotice
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110 cursor-pointer'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-500 cursor-pointer'
                        }`}
                        title={hasNotice ? agreement.notice : "Lägg till notering"}
                      >
                        {hasNotice ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    );
                  })()}
                </div>

                {/* Bild-kolumn */}
                <div className="col-span-1 flex justify-center">
                  {(() => {
                    const images = parseImages(agreement.images);
                    const hasImages = images && images.length > 0;
                    
                    return (
                      <button
                        onClick={(e) => handleImageClick(e, agreement)}
                        className={`p-1.5 rounded-lg transition-all ${
                          hasImages
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:scale-110 cursor-pointer'
                            : 'text-zinc-300 dark:text-zinc-700 cursor-default'
                        }`}
                        title={hasImages ? `${images.length} bild${images.length !== 1 ? 'er' : ''} - Klicka för att visa` : 'Inga bilder'}
                        disabled={!hasImages}
                      >
                        <CheckCircle2 size={18} className={hasImages ? 'fill-emerald-500 text-emerald-500' : ''} />
                      </button>
                    );
                  })()}
                </div>

                <div className="col-span-2 sm:col-span-2 flex justify-start items-center gap-2">
                  {agreement.start_date && agreement.end_date && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {agreement.start_date} → {agreement.end_date}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                    agreement.status === 'Aktiv' 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : agreement.status === 'Uppsagd'
                      ? 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
                      : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  }`}>
                    {agreement.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <AgreementFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Image Lightbox */}
      {lightboxImages && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};

export default AgreementsTab;

