import React, { useState, useRef, useEffect } from 'react';
import { X, Tag, FileText, UploadCloud, Trash2, ChevronRight, Calendar, DollarSign, Building2, Image as ImageIcon, Car } from 'lucide-react';
import { formatAmount } from '../utils/formatAmount';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeBgClass, getThemeBorderClass, getThemeButtonClass, getThemeTextClass, getThemeRingClass } from '../utils/getThemeClasses';
import ImageLightbox from './ImageLightbox';
import { useImageLightbox } from '../hooks/useImageLightbox';

const AgreementDrawer = ({ agreement, onClose, onSave, onDelete, onImageUpload, categories, vehicles = [] }) => {
  const { colorTheme, isDarkMode } = useTheme();
  const { lightboxImages, lightboxIndex, openLightbox, closeLightbox, setLightboxIndex } = useImageLightbox();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: agreement.name || '',
    provider: agreement.provider || '',
    cost: agreement.cost || '',
    frequency: agreement.frequency || 'Månadsvis',
    next_payment: agreement.next_payment || '',
    status: agreement.status || 'Aktiv',
    category: agreement.category || '',
    icon: agreement.icon || '📄',
    notice: agreement.notice || '',
    start_date: agreement.start_date || '',
    end_date: agreement.end_date || ''
  });

  // Parse images from JSON string or array
  const parseImages = (imagesData) => {
    if (!imagesData) return [];
    if (Array.isArray(imagesData)) return imagesData;
    try {
      return JSON.parse(imagesData);
    } catch {
      return [];
    }
  };

  const [images, setImages] = useState(parseImages(agreement.images)); // Array med bildsökvägar
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedVehicleId, setLinkedVehicleId] = useState(null);
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const nextPaymentPickerRef = useRef(null);

  // Hitta kopplat fordon (om det finns)
  const linkedVehicle = vehicles.find(v => v.agreement_id === agreement.id);
  
  // Uppdatera state när agreement ändras
  useEffect(() => {
    setFormData({
      name: agreement.name || '',
      provider: agreement.provider || '',
      cost: agreement.cost || '',
      frequency: agreement.frequency || 'Månadsvis',
      next_payment: agreement.next_payment || '',
      status: agreement.status || 'Aktiv',
      category: agreement.category || '',
      icon: agreement.icon || '📄',
      notice: agreement.notice || '',
      start_date: agreement.start_date || '',
      end_date: agreement.end_date || ''
    });
    // Parse och uppdatera bilder
    const parsedImages = parseImages(agreement.images);
    console.log('🖼️ [AgreementDrawer] useEffect - Parsed images:', parsedImages, 'from agreement.images:', agreement.images);
    setImages(parsedImages);
    
    // Uppdatera linkedVehicleId
    if (linkedVehicle) {
      setLinkedVehicleId(linkedVehicle.id);
    } else {
      setLinkedVehicleId(null);
    }
  }, [agreement, vehicles, linkedVehicle]);

  // Beräkna nästa betalning vid ändring av startdatum eller frekvens
  const calculateNextPayment = (currentDate, frequency) => {
    if (!currentDate) return '';
    
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'Månadsvis':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'Kvartalsvis':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'Årligen':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return '';
    }
    
    return date.toISOString().split('T')[0];
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Om frekvens eller next_payment ändras, beräkna nytt next_payment
      if (field === 'frequency' || field === 'next_payment') {
        if (field === 'frequency' && prev.next_payment) {
          updated.next_payment = calculateNextPayment(prev.next_payment, value);
        }
      }
      
      return updated;
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && onImageUpload) {
      for (const file of files) {
        try {
          console.log('📤 Försöker ladda upp bild:', file.name, 'för avtal:', agreement.id);
          const result = await onImageUpload(agreement.id, file);
          console.log('✅ Bild uppladdad, resultat:', result);
          
          // Lägg till den nya bilden i listan
          if (result && result.image_path) {
            setImages(prev => {
              const updated = [...prev, result.image_path];
              console.log('📸 Uppdaterad bildlista:', updated);
              return updated;
            });
            alert(`Bild "${file.name}" uppladdad!`);
          } else {
            console.error('❌ Inget image_path i resultatet:', result);
            alert('Kunde inte ladda upp bild. Inget svar från servern.');
          }
        } catch (error) {
          console.error('❌ Kunde inte ladda upp bild:', error);
          alert(`Kunde inte ladda upp bild: ${error.message}`);
        }
      }
    }
    // Rensa input så samma fil kan väljas igen
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(agreement.id, {
        ...formData,
        images: images, // Inkludera bilderna i uppdateringen
        linked_vehicle_id: linkedVehicleId // Skicka med kopplat fordon
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    // Bekräfta radering
    const confirmed = window.confirm(`Är du säker på att du vill radera "${agreement.name}"? Detta kan inte ångras.`);
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await onDelete(agreement.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveImage = async (imagePath) => {
    const updatedImages = images.filter(img => img !== imagePath);
    setImages(updatedImages);
    
    // Uppdatera direkt i backend
    try {
      await onSave(agreement.id, {
        ...formData,
        images: updatedImages
      });
    } catch (error) {
      console.error('Kunde inte ta bort bild:', error);
      // Återställ om det misslyckades
      setImages(images);
    }
  };

  const iconOptions = [
    '🏠', '🚗', '📱', '💻', '🎵', '💪', '🏢', '📊', 
    '🔒', '🌐', '📺', '☕', '🍔', '✈️', '🏥', '🎓'
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{agreement.name}</h2>
          <p className="text-sm text-zinc-500">{agreement.provider}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Kostnad */}
        <div className="text-center py-4">
          <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatAmount(formData.cost)}
          </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              formData.status === 'Aktiv' 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : formData.status === 'Uppsagd'
                ? 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
            }`}>
              {formData.status}
            </span>
          </div>
        </div>

        {/* Tjänst / Namn */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} /> Tjänst / Namn
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
          />
        </div>

        {/* Leverantör */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={14} /> Leverantör / Företag
          </label>
          <input
            type="text"
            value={formData.provider}
            onChange={(e) => handleChange('provider', e.target.value)}
            className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
          />
        </div>

        {/* Kostnad & Frekvens */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={14} /> Kostnad (kr)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} /> Frekvens
            </label>
            <div className="relative">
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none cursor-pointer`}
              >
                <option value="Månadsvis">Månadsvis</option>
                <option value="Kvartalsvis">Kvartalsvis</option>
                <option value="Årligen">Årligen</option>
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Startdatum & Slutdatum */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} /> Startdatum
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.start_date || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, ''); // Only numbers
                  
                  // Limit: 4 digits for year, 2 for month, 2 for day
                  if (value.length > 8) value = value.slice(0, 8);
                  
                  // Format as YYYY-MM-DD while typing
                  let formatted = '';
                  if (value.length <= 4) {
                    formatted = value;
                  } else if (value.length <= 6) {
                    formatted = value.slice(0, 4) + '-' + value.slice(4);
                  } else {
                    formatted = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
                  }
                  
                  handleChange('start_date', formatted);
                }}
                placeholder="ÅÅÅÅ-MM-DD"
                maxLength={10}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
              />
              <input
                ref={startDatePickerRef}
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => startDatePickerRef.current?.showPicker?.() || startDatePickerRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <Calendar size={18} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} /> Slutdatum
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.end_date || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, ''); // Only numbers
                  
                  // Limit: 4 digits for year, 2 for month, 2 for day
                  if (value.length > 8) value = value.slice(0, 8);
                  
                  // Format as YYYY-MM-DD while typing
                  let formatted = '';
                  if (value.length <= 4) {
                    formatted = value;
                  } else if (value.length <= 6) {
                    formatted = value.slice(0, 4) + '-' + value.slice(4);
                  } else {
                    formatted = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
                  }
                  
                  handleChange('end_date', formatted);
                }}
                placeholder="ÅÅÅÅ-MM-DD"
                maxLength={10}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
              />
              <input
                ref={endDatePickerRef}
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => endDatePickerRef.current?.showPicker?.() || endDatePickerRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <Calendar size={18} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />
              </button>
            </div>
          </div>
        </div>

        {/* Nästa betalning & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500 dark:text-indigo-400" /> Nästa betalning
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.next_payment || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, ''); // Only numbers
                  
                  // Limit: 4 digits for year, 2 for month, 2 for day
                  if (value.length > 8) value = value.slice(0, 8);
                  
                  // Format as YYYY-MM-DD while typing
                  let formatted = '';
                  if (value.length <= 4) {
                    formatted = value;
                  } else if (value.length <= 6) {
                    formatted = value.slice(0, 4) + '-' + value.slice(4);
                  } else {
                    formatted = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
                  }
                  
                  handleChange('next_payment', formatted);
                }}
                placeholder="ÅÅÅÅ-MM-DD"
                maxLength={10}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
              />
              <input
                ref={nextPaymentPickerRef}
                type="date"
                value={formData.next_payment || ''}
                onChange={(e) => handleChange('next_payment', e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => nextPaymentPickerRef.current?.showPicker?.() || nextPaymentPickerRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <Calendar size={18} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} /> Status
            </label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none cursor-pointer`}
              >
                <option value="Aktiv">Aktiv</option>
                <option value="Uppsagd">Uppsagd</option>
                <option value="Väntar på motpart">Väntar på motpart</option>
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Tag size={14} /> Kategori
          </label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Koppla till fordon (om försäkring) */}
        {formData.category === 'Försäkring' && vehicles && vehicles.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Car size={14} /> Koppla till fordon
            </label>
            <div className="relative">
              <select
                value={linkedVehicleId || ''}
                onChange={(e) => {
                  const vehicleId = e.target.value ? parseInt(e.target.value) : null;
                  setLinkedVehicleId(vehicleId);
                }}
                className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none cursor-pointer`}
              >
                <option value="">Ingen koppling</option>
                {vehicles
                  .filter(v => v.status === 'Aktiv')
                  .map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make_model} ({vehicle.registration_number})
                    </option>
                  ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
            </div>
            {linkedVehicle && (
              <p className="text-xs text-zinc-500 mt-1">
                Kopplad till: {linkedVehicle.make_model} ({linkedVehicle.registration_number})
              </p>
            )}
          </div>
        )}

        {/* Ikon */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Ikon (Emoji)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              maxLength={2}
              className={`w-20 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-2xl text-center outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
            />
            <div className="flex-1 flex flex-wrap gap-1">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleChange('icon', icon)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                    formData.icon === icon
                      ? `${getThemeBgClass(colorTheme, isDarkMode)} border-2 ${getThemeBorderClass(colorTheme)}`
                      : `bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 ${
                        colorTheme === 'indigo' ? 'hover:border-indigo-500' :
                        colorTheme === 'blue' ? 'hover:border-blue-500' :
                        colorTheme === 'emerald' ? 'hover:border-emerald-500' :
                        colorTheme === 'purple' ? 'hover:border-purple-500' :
                        colorTheme === 'rose' ? 'hover:border-rose-500' :
                        'hover:border-amber-500'
                      }`
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notis */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Notis / Kommentar
          </label>
          <textarea
            value={formData.notice}
            onChange={(e) => handleChange('notice', e.target.value)}
            rows={3}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Avtalsbilder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} /> Avtalsbilder
            </label>
            {images.length > 0 && (
              <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                {images.length} bild{images.length !== 1 ? 'er' : ''} uppladdad{images.length !== 1 ? 'a' : ''}
              </span>
            )}
          </div>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/30 group ${
              colorTheme === 'indigo' ? 'hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10' :
              colorTheme === 'blue' ? 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' :
              colorTheme === 'emerald' ? 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' :
              colorTheme === 'purple' ? 'hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10' :
              colorTheme === 'rose' ? 'hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10' :
              'hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
            }`}
          >
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Klicka för att ladda upp bilder</p>
            <p className="text-xs text-zinc-500 mt-1">PNG, JPG (flera bilder kan väljas)</p>
          </div>

          {/* Visa uppladdade bilder */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {images.map((imagePath, index) => {
                // Hantera både relativa och absoluta sökvägar
                let imageUrl;
                const normalizedPath = imagePath.replace(/\\/g, '/');
                
                console.log(`🖼️ [AgreementDrawer] Bild ${index + 1}:`, imagePath, 'Normaliserad:', normalizedPath);
                
                if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                  // Fullständig URL
                  imageUrl = imagePath;
                } else if (imagePath.includes(':\\') || (imagePath.startsWith('/') && !imagePath.startsWith('/uploads'))) {
                  // Absolut sökväg (Windows eller Unix absolut) - använd custom file endpoint
                  imageUrl = `http://192.168.1.232:5000/api/files/${encodeURIComponent(normalizedPath)}`;
                } else {
                  // Relativ sökväg - använd uploads endpoint
                  // Om sökvägen redan börjar med "uploads/", ta bort det
                  let pathToUse = normalizedPath;
                  if (pathToUse.startsWith('uploads/')) {
                    pathToUse = pathToUse.replace('uploads/', '');
                  }
                  // Om sökvägen börjar med "avtal/", använd den direkt
                  if (pathToUse.startsWith('avtal/')) {
                    imageUrl = `http://192.168.1.232:5000/uploads/${pathToUse}`;
                  } else {
                    // Annars, försök med avtal/ prefix
                    imageUrl = `http://192.168.1.232:5000/uploads/avtal/${pathToUse}`;
                  }
                }
                
                console.log(`🖼️ [AgreementDrawer] Bild URL:`, imageUrl);
                
                return (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl}
                      alt={`Avtalsbild ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:opacity-90 transition-opacity"
                      onDoubleClick={() => {
                        openLightbox(images, index);
                      }}
                      onLoad={() => {
                        console.log(`✅ [AgreementDrawer] Bild ${index + 1} laddad:`, imageUrl);
                      }}
                      onError={(e) => {
                        console.error('❌ [AgreementDrawer] Kunde inte ladda bild:', imageUrl, 'Original sökväg:', imagePath);
                        
                        // Försök alternativa sökvägar
                        const alternatives = [];
                        
                        // Om det är en relativ sökväg, försök olika varianter
                        if (!imagePath.includes(':\\') && !imagePath.startsWith('/')) {
                          const basePath = normalizedPath.replace('avtal/', '');
                          alternatives.push(
                            `http://192.168.1.232:5000/api/files/${encodeURIComponent(normalizedPath)}`,
                            `http://192.168.1.232:5000/uploads/${normalizedPath}`,
                            `http://192.168.1.232:5000/uploads/avtal/${basePath}`,
                            `http://192.168.1.232:5000/api/files/${encodeURIComponent(basePath)}`
                          );
                        } else {
                          // För absoluta sökvägar, försök med olika encoding
                          alternatives.push(
                            `http://192.168.1.232:5000/api/files/${normalizedPath}`,
                            `http://192.168.1.232:5000/api/files/${encodeURIComponent(normalizedPath)}`
                          );
                        }
                        
                        // Försök nästa alternativ
                        let altIndex = 0;
                        const tryNext = () => {
                          if (altIndex < alternatives.length) {
                            console.log(`🔄 [AgreementDrawer] Försöker alternativ ${altIndex + 1}:`, alternatives[altIndex]);
                            e.target.src = alternatives[altIndex];
                            altIndex++;
                            e.target.onerror = tryNext;
                          } else {
                            // Alla alternativ misslyckades
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12"%3EBild saknas%3C/text%3E%3C/svg%3E';
                            e.target.onerror = null;
                          }
                        };
                        tryNext();
                      }}
                    />
                    <button
                      onClick={() => handleRemoveImage(imagePath)}
                      className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Ta bort bild"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Avtals-ID */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Avtals-ID</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">#{agreement.id.toString().padStart(6, '0')}</span>
          </div>
        </div>

      </div>
      
      {/* Image Lightbox */}
      {lightboxImages && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}

      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
        <button 
          onClick={handleSave}
          disabled={isSaving || isDeleting}
          className={`flex-1 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? 'Sparar...' : 'Spara Ändringar'}
        </button>
        <button 
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Radera avtal"
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default AgreementDrawer;

