import React, { useState } from 'react';
import { SupplierRecord, SourcingRegion } from '../types';
import { SUPPLIERS } from '../data/suppliers';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  Search, 
  MapPin, 
  Star, 
  Send, 
  CheckCircle2, 
  SlidersHorizontal,
  Mail
} from 'lucide-react';

interface SupplierDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: SourcingRegion;
}

export const SupplierDirectoryModal: React.FC<SupplierDirectoryModalProps> = ({
  isOpen,
  onClose,
  selectedRegion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterRegion, setSelectedFilterRegion] = useState<string>('all');
  const [rfqSentIds, setRfqSentIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSuppliers = SUPPLIERS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specialties.some((spec) => spec.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRegion = selectedFilterRegion === 'all' || s.regionId === selectedFilterRegion;
    return matchesSearch && matchesRegion;
  });

  const handleSendRfq = (supId: string, supName: string) => {
    setRfqSentIds((prev) => [...prev, supId]);
    setNotification(`RFQ & Should-Cost Package dispatched to ${supName}`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Global Vetted Supplier Network (250,000+ Vendors)
              </h3>
              <p className="text-xs text-slate-400">
                Audited Tier-1 and Tier-2 manufacturers with IATF 16949 & AS9100D certifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by capability, location, or process..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-xs rounded-xl pl-9 pr-3.5 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Filter Region:</span>
            <select
              value={selectedFilterRegion}
              onChange={(e) => setSelectedFilterRegion(e.target.value)}
              className="bg-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all">All Global Corridors</option>
              <option value="india-hub">India (Bengaluru / Jaipur)</option>
              <option value="mexico-hub">Mexico (Monterrey Nearshore)</option>
              <option value="vietnam-hub">Vietnam (Hai Phong)</option>
              <option value="usa-hub">United States (Domestic)</option>
              <option value="china-hub">China (Ningbo / Delta)</option>
            </select>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 text-center animate-fade-in">
            ✓ {notification}
          </div>
        )}

        {/* Suppliers List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
          {filteredSuppliers.map((sup) => {
            const isSent = rfqSentIds.includes(sup.id);

            return (
              <div
                key={sup.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">{sup.name}</h4>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-300" />
                      {sup.auditedRating} Audited
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{sup.city} ({sup.regionName})</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sup.certifications.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                        {c}
                      </span>
                    ))}
                    {sup.specialties.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Historical Quote Delta</div>
                    <div className={`text-xs font-mono font-bold ${sup.quotedShouldCostDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sup.quotedShouldCostDelta > 0 ? `+${sup.quotedShouldCostDelta}%` : `${sup.quotedShouldCostDelta}%`} vs Should-Cost
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendRfq(sup.id, sup.name)}
                    disabled={isSent}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                      isSent
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RFQ Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Should-Cost RFQ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredSuppliers.length} verified vendors matching capabilities</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
