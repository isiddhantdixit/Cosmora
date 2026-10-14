import React, { useState } from 'react';
import { Mail, Check, Copy, User, ExternalLink, X, Sparkles, Building2, Globe } from 'lucide-react';

interface DeveloperContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperContactModal: React.FC<DeveloperContactModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const developerName = 'Siddhant Dixit';
  const developerEmail = 'siddhantdixit@lifagroup.in';
  const organization = 'LIFA Group';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(developerEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-[#48D7FF]/30 p-6 sm:p-7 flex flex-col space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#48D7FF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#163B70] to-[#071126] border border-[#48D7FF]/40 flex items-center justify-center shadow-glow-cyan/30">
              <User className="w-5 h-5 text-[#48D7FF]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#EDF5FF]">
                Developer Contact
              </h3>
              <p className="text-[11px] text-[#9EACC4] font-mono">
                Cosmora Astrophysics & AR Project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9EACC4] hover:text-[#EDF5FF] hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Developer Profile Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#48D7FF] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lead Developer</span>
              </div>
              <h4 className="text-xl font-bold font-display text-[#EDF5FF] tracking-wide">
                {developerName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-[#9EACC4] font-mono mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-[#48D7FF]/80" />
                <span>{organization}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#163B70]/50 border border-[#48D7FF]/30 flex items-center justify-center font-display font-bold text-lg text-[#48D7FF]">
              SD
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <span className="text-[10px] font-mono text-[#9EACC4] uppercase tracking-wider block">
              Official Email
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-mono text-[#EDF5FF] select-all truncate">
                {developerEmail}
              </span>
              <button
                onClick={handleCopyEmail}
                className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#48D7FF] text-xs font-mono flex items-center gap-1 transition-all"
                title="Copy email to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href={`mailto:${developerEmail}?subject=Regarding%20Cosmora%20Project`}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#48D7FF] text-[#030611] font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-glow-cyan hover:brightness-110 transition-all text-center"
          >
            <Mail className="w-4 h-4" />
            <span>Send Direct Email</span>
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-[#EDF5FF] border border-white/10 transition-all text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
