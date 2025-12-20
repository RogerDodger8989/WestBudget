import React, { useState, useRef, useEffect } from 'react';
import { X, Car, Gauge, Calendar, FileText, UploadCloud, Trash2, Building2, Tag } from 'lucide-react';
import { formatAmount } from '../utils/formatAmount';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeRingClass } from '../utils/getThemeClasses';
import ImageLightbox from './ImageLightbox';
import { useImageLightbox } from '../hooks/useImageLightbox';

const VehicleDrawer = ({ vehicle, onClose, onSave, onDelete, onImageUpload, agreements = [] }) => {
  const { colorTheme } = useTheme();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    registration_number: vehicle.registration_number || '',
    make_model: vehicle.make_model || '',
    odometer: vehicle.odometer || '',
    next_inspection: vehicle.next_inspection || '',
    insurance_company: vehicle.insurance_company || '',
    insurance_type: vehicle.insurance_type || '',
    status: vehicle.status || 'Aktiv',
    category: vehicle.category || 'Personbil',
    note: vehicle.note || '',
    agreement_id: vehicle.agreement_id || '',
    next_service_odometer: vehicle.next_service_odometer || '',
    next_service_date: vehicle.next_service_date || ''
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

  const [images, setImages] = useState(parseImages(vehicle.images));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inspectionDatePickerRef = useRef(null);
  const serviceDatePickerRef = useRef(null);

  // Uppdatera state när vehicle ändras
  useEffect(() => {
    setFormData({
      registration_number: vehicle.registration_number || '',
      make_model: vehicle.make_model || '',
      odometer: vehicle.odometer || '',
      next_inspection: vehicle.next_inspection || '',
      insurance_company: vehicle.insurance_company || '',
      insurance_type: vehicle.insurance_type || '',
      status: vehicle.status || 'Aktiv',
      category: vehicle.category || 'Personbil',
      note: vehicle.note || '',
      agreement_id: vehicle.agreement_id || '',
      next_service_odometer: vehicle.next_service_odometer || '',
      next_service_date: vehicle.next_service_date || ''
    });
    setImages(parseImages(vehicle.images));
  }, [vehicle]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format date input (YYYY-MM-DD)
  const formatDateInput = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  };

  const handleDateChange = (field, value) => {
    const formatted = formatDateInput(value);
    handleChange(field, formatted);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && onImageUpload) {
      for (const file of files) {
        try {
          const result = await onImageUpload(vehicle.id, file);
          if (result && result.image_path) {
            setImages(prev => [...prev, result.image_path]);
          }
        } catch (error) {
          console.error('Kunde inte ladda upp bild:', error);
        }
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { insurance_company, insurance_type, ...saveData } = formData;
      await onSave(vehicle.id, {
        ...saveData,
        images: images,
        odometer: formData.odometer ? parseInt(formData.odometer) : 0,
        next_service_odometer: formData.next_service_odometer ? parseInt(formData.next_service_odometer) : null,
        agreement_id: formData.agreement_id ? parseInt(formData.agreement_id) : null
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm(`Är du säker på att du vill radera "${vehicle.make_model}" (${vehicle.registration_number})? Detta kan inte ångras.`);
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await onDelete(vehicle.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveImage = async (imagePath) => {
    const updatedImages = images.filter(img => img !== imagePath);
    setImages(updatedImages);
    
    try {
      await onSave(vehicle.id, {
        ...formData,
        images: updatedImages
      });
    } catch (error) {
      console.error('Kunde inte ta bort bild:', error);
      setImages(images);
    }
  };

  // Filter agreements to only show insurance-related ones
  const insuranceAgreements = agreements.filter(a => 
    a.category === 'Försäkring' && a.status === 'Aktiv'
  );

  // Get linked agreement info
  const linkedAgreement = insuranceAgreements.find(a => a.id === vehicle.agreement_id);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{vehicle.make_model}</h2>
          <p className="text-sm text-zinc-500 font-mono uppercase">{vehicle.registration_number}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Status */}
        <div className="text-center py-4">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            formData.status === 'Aktiv' 
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : formData.status === 'Såld'
              ? 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
              : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
          }`}>
            {formData.status}
          </span>
        </div>

        {/* Registreringsnummer */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Car size={14} /> Registreringsnummer
          </label>
          <input
            type="text"
            value={formData.registration_number}
            onChange={(e) => handleChange('registration_number', e.target.value.toUpperCase())}
            className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white font-mono uppercase focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
          />
        </div>

        {/* Märke/Modell */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Car size={14} /> Märke/Modell
          </label>
          <input
            type="text"
            value={formData.make_model}
            onChange={(e) => handleChange('make_model', e.target.value)}
            className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
          />
        </div>

        {/* Mätarställning & Kategori */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={14} /> Mätarställning (mil)
            </label>
            <input
              type="number"
              min="0"
              value={formData.odometer}
              onChange={(e) => handleChange('odometer', e.target.value)}
              className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} /> Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
            >
              <option value="Personbil">Personbil</option>
              <option value="Firmabil">Firmabil</option>
              <option value="Motorcykel">Motorcykel</option>
              <option value="Lastbil">Lastbil</option>
              <option value="Övrigt">Övrigt</option>
            </select>
          </div>
        </div>

        {/* Nästa besiktning */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} /> Nästa besiktning
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.next_inspection || ''}
              onChange={(e) => handleDateChange('next_inspection', e.target.value)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none font-mono`}
            />
            <input
              ref={inspectionDatePickerRef}
              type="date"
              value={formData.next_inspection || ''}
              onChange={(e) => handleChange('next_inspection', e.target.value)}
              className="absolute opacity-0 pointer-events-none"
              style={{ width: 0, height: 0 }}
            />
            <button
              type="button"
              onClick={() => inspectionDatePickerRef.current?.showPicker?.() || inspectionDatePickerRef.current?.click()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              <Calendar size={18} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />
            </button>
          </div>
        </div>

        {/* Koppla till avtal (försäkring) */}
        {insuranceAgreements.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              Koppla till försäkringsavtal
            </label>
            <select
              value={formData.agreement_id || ''}
              onChange={(e) => handleChange('agreement_id', e.target.value)}
              className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
            >
              <option value="">Ingen koppling</option>
              {insuranceAgreements.map(agreement => (
                <option key={agreement.id} value={agreement.id}>
                  {agreement.name} - {agreement.provider} ({formatAmount(agreement.cost)}/{agreement.frequency.toLowerCase()})
                </option>
              ))}
            </select>
            {linkedAgreement && (
              <p className="text-xs text-zinc-500 mt-1">
                Kopplad till: {linkedAgreement.name} - Nästa betalning: {linkedAgreement.next_payment}
              </p>
            )}
          </div>
        )}

        {/* Nästa service */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={14} /> Nästa service (mil)
            </label>
            <input
              type="number"
              min="0"
              value={formData.next_service_odometer || ''}
              onChange={(e) => handleChange('next_service_odometer', e.target.value)}
              placeholder="mil"
              className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} /> Nästa service (datum)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.next_service_date || ''}
                onChange={(e) => handleDateChange('next_service_date', e.target.value)}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none font-mono`}
              />
              <input
                ref={serviceDatePickerRef}
                type="date"
                value={formData.next_service_date || ''}
                onChange={(e) => handleChange('next_service_date', e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => serviceDatePickerRef.current?.showPicker?.() || serviceDatePickerRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <Calendar size={18} className={getThemeTextClass(colorTheme, false) + ' dark:' + getThemeTextClass(colorTheme, true)} />
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none`}
          >
            <option value="Aktiv">Aktiv</option>
            <option value="Inaktiv">Inaktiv</option>
            <option value="Såld">Såld</option>
          </select>
        </div>

        {/* Noteringar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} /> Noteringar
          </label>
          <textarea
            value={formData.note || ''}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="Lägg till noteringar om fordonet..."
            rows={3}
            className={`w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none resize-none`}
          />
        </div>

        {/* Bilder */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <UploadCloud size={14} /> Bilder
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
          >
            <UploadCloud size={18} />
            Ladda upp bilder
          </button>
          
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((imagePath, idx) => {
                // Construct image URL
                const imageUrl = imagePath.startsWith('http') 
                  ? imagePath 
                  : imagePath.startsWith('/') || imagePath.startsWith('uploads/')
                  ? `http://192.168.1.232:5000/${imagePath.replace(/^\/+/, '')}`
                  : `http://192.168.1.232:5000/uploads/${imagePath}`;
                
                return (
                  <div key={idx} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Vehicle ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:opacity-90 transition-opacity"
                      onDoubleClick={() => {
                        openLightbox(images, idx);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imagePath)}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Footer med knappar */}
      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || !onDelete}
          className="px-4 py-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isDeleting ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Raderar...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Radera
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`flex-1 px-4 py-2.5 ${getThemeButtonClass(colorTheme, 'primary')} rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sparar...
            </>
          ) : (
            'Spara ändringar'
          )}
        </button>
      </div>
    </div>
  );
};

export default VehicleDrawer;

