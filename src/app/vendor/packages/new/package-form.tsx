"use client";

import { useState, useRef } from "react";
import { createVendorPackage } from "../actions";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, GripVertical, Image as ImageIcon, Bus, Hotel, Ticket, AlertCircle } from "lucide-react";

type MediaItem = 
  | { type: "url"; value: string; id: string }
  | { type: "file"; value: File; preview: string; id: string; caption: string };

// Define specific details types for cleaner handling
type AccommodationDetails = { stars?: number; nights?: number; note?: string };
type ActivityDetails = { duration?: string; note?: string };
type TransportDetails = { type?: string; note?: string };
type OtherDetails = { note?: string };

type ComponentItem = {
  id: string;
  type: "accommodation" | "activity" | "transport" | "other";
  title: string;
  // Store structured data instead of JSON string
  data: AccommodationDetails & ActivityDetails & TransportDetails & OtherDetails; 
};

export function PackageForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [priceDisplay, setPriceDisplay] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const val = e.target.value.replace(/[^0-9.]/g, "");
    setPriceDisplay(val);
  };

  const handlePriceBlur = () => {
    if (!priceDisplay) return;
    const num = parseFloat(priceDisplay);
    if (!isNaN(num)) {
      setPriceDisplay(num.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: MediaItem[] = Array.from(e.target.files).map((file) => ({
        type: "file",
        value: file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        caption: ""
      }));
      setMediaItems([...mediaItems, ...newFiles]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = (id: string) => {
    setMediaItems(items => items.filter(i => i.id !== id));
  };

  const updateMediaCaption = (id: string, caption: string) => {
    setMediaItems((items) =>
      items.map((item) =>
        item.id === id && item.type === "file" ? { ...item, caption } : item
      )
    );
  };

  const addComponent = () => {
    setComponents([
      ...components,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: "activity",
        title: "",
        data: {}
      }
    ]);
  };

  const updateComponent = (id: string, field: keyof ComponentItem, value: any) => {
    setComponents(comps => comps.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateComponentData = (id: string, field: string, value: any) => {
    setComponents(comps => comps.map(c => {
      if (c.id !== id) return c;
      return { ...c, data: { ...c.data, [field]: value } };
    }));
  };

  const removeComponent = (id: string) => {
    setComponents(comps => comps.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // 1. Process Price (convert formatted string to cents)
      const priceNum = parseFloat(priceDisplay.replace(/,/g, ""));
      const priceCents = Math.round(priceNum * 100);
      formData.set("priceCents", priceCents.toString());

      // 2. Process Media
      // Separate existing URLs and new Files
      const existingUrls = mediaItems
        .filter(m => m.type === "url")
        .map(m => m.value);
      
      // Add existing URLs as JSON string
      formData.set("media", JSON.stringify(existingUrls));

      // Append new files
      mediaItems.forEach(m => {
        if (m.type === "file") {
          formData.append("media_files", m.value as File);
        }
      });

      // 3. Process Components
      const finalComponents = components.map(c => {
        // Filter data based on type to keep JSON clean
        let details: any = {};
        if (c.type === "accommodation") {
          details = { stars: c.data.stars, nights: c.data.nights, note: c.data.note };
        } else if (c.type === "activity") {
          details = { duration: c.data.duration, note: c.data.note };
        } else {
          details = { note: c.data.note };
        }

        // Remove undefined keys
        Object.keys(details).forEach(key => details[key] === undefined && delete details[key]);

        return {
          type: c.type,
          title: c.title,
          details: details
        };
      });
      formData.set("components", JSON.stringify(finalComponents));

      // Submit
      await createVendorPackage(formData);
      
      // Redirect or show success (action doesn't return much, assume success if no throw)
      router.push("/vendor/packages");
      router.refresh();

    } catch (err) {
      console.error(err);
      alert("Failed to create package. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Basic Information</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Package Title</label>
          <input 
            name="name" 
            className="mt-1 w-full rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500" 
            required 
            placeholder="Example: 5D4N Langkawi Island Getaway"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Description</label>
          <textarea 
            name="description" 
            className="mt-1 w-full rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500" 
            rows={4} 
            required 
            placeholder="Describe the itinerary highlights, inclusions, and what makes this trip special..."
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Pricing & Commission</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Price (MYR)</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">RM</span>
              <input 
                type="text" 
                value={priceDisplay}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                className="w-full rounded bg-neutral-950 pl-10 pr-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500" 
                placeholder="0.00"
                required 
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">Enter the full price per person.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Commission Rate (%)</label>
            <input 
              type="number" 
              name="commissionRate" 
              className="mt-1 w-full rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500" 
              defaultValue={0} 
              min={0} 
              max={100} 
            />
            <p className="mt-1 text-xs text-neutral-500">Percentage of sale to pay as commission (0-100).</p>
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Media Gallery</h2>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            <Upload size={16} /> Add Images/Videos
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept="image/*,video/*" 
            onChange={handleFileSelect} 
          />
        </div>
        
        {mediaItems.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded border border-dashed border-neutral-700 bg-neutral-900/50 text-neutral-500">
            <ImageIcon size={24} className="mb-2 opacity-50" />
            <p className="text-sm">No media added yet. Upload high-quality images to attract travelers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {mediaItems.map((item, idx) => (
              <div key={item.id} className="group relative overflow-hidden rounded border border-neutral-800 bg-neutral-950">
                <div className="aspect-square w-full">
                  {item.type === "file" || item.value.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                     <img 
                       src={item.type === "file" ? item.preview : item.value as string} 
                       alt="Preview" 
                       className="h-full w-full object-cover"
                     />
                  ) : (
                     <div className="flex h-full items-center justify-center text-neutral-500">Video/File</div>
                  )}
                </div>
                {item.type === "file" && (
                  <div className="border-t border-neutral-800 p-2">
                    <input 
                      type="text" 
                      placeholder="Add caption..." 
                      className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                      value={item.caption}
                      onChange={(e) => updateMediaCaption(item.id, e.target.value)}
                    />
                  </div>
                )}
                <button 
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 hover:bg-red-500 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Components */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Itinerary Components</h2>
          <button 
            type="button" 
            onClick={addComponent}
            className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            <Plus size={16} /> Add Component
          </button>
        </div>

        {components.length === 0 ? (
          <div className="rounded border border-dashed border-neutral-700 p-6 text-center text-neutral-500">
            <p className="text-sm">Build your itinerary by adding components like accommodation, activities, and transport.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div key={comp.id} className="flex gap-4 rounded border border-neutral-800 bg-neutral-950 p-4">
                <div className="mt-2 text-neutral-600"><GripVertical size={20} /></div>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-1/3">
                      <label className="mb-1 block text-xs text-neutral-400">Type</label>
                      <select 
                        value={comp.type}
                        onChange={(e) => updateComponent(comp.id, "type", e.target.value)}
                        className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white ring-1 ring-neutral-800"
                      >
                        <option value="accommodation">Accommodation</option>
                        <option value="activity">Activity</option>
                        <option value="transport">Transport</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="w-2/3">
                      <label className="mb-1 block text-xs text-neutral-400">Title <span className="text-red-400">*</span></label>
                      <input 
                        value={comp.title}
                        onChange={(e) => updateComponent(comp.id, "title", e.target.value)}
                        placeholder={comp.type === "accommodation" ? "e.g., 3 Nights at Ritz Carlton" : "e.g., Island Hopping Tour"}
                        className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Dynamic Fields based on Type */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {comp.type === "accommodation" && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs text-neutral-400">Stars (1-5)</label>
                          <select 
                            value={comp.data.stars || ""}
                            onChange={(e) => updateComponentData(comp.id, "stars", parseInt(e.target.value))}
                            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500"
                          >
                            <option value="">Select Stars</option>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-neutral-400">Nights</label>
                          <input 
                            type="number"
                            min="1"
                            value={comp.data.nights || ""}
                            onChange={(e) => updateComponentData(comp.id, "nights", parseInt(e.target.value))}
                            placeholder="e.g. 3"
                            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500"
                          />
                        </div>
                      </>
                    )}

                    {comp.type === "activity" && (
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-neutral-400">Duration</label>
                        <input 
                          value={comp.data.duration || ""}
                          onChange={(e) => updateComponentData(comp.id, "duration", e.target.value)}
                          placeholder="e.g. 4 hours, Full Day"
                          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-neutral-400">Details / Notes</label>
                      <textarea 
                        value={comp.data.note || ""}
                        onChange={(e) => updateComponentData(comp.id, "note", e.target.value)}
                        placeholder="Add any extra details, pickup info, or special requirements..."
                        className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500"
                        rows={2}
                      />
                    </div>
                  </div>

                </div>
                <button 
                  type="button"
                  onClick={() => removeComponent(comp.id)}
                  className="self-start text-neutral-500 hover:text-red-400"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full rounded bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Creating Package..." : "Create Trip Package"}
        </button>
      </div>
    </form>
  );
}
