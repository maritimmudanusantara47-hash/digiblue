'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

export interface PartnerItem {
  id: string;
  name: string;
  sub: string;
  badge: string;
  desc: string;
  logo: string;
  alt: string;
  borderColor: string;
  badgeStyle: string;
  glowColor: string;
  tags: string[];
}

interface PartnershipExpandableCardsProps {
  partners: PartnerItem[];
  expandHint?: string;
  viewDetailsText?: string;
  hideDetailsText?: string;
}

export default function PartnershipExpandableCards({
  partners,
}: PartnershipExpandableCardsProps) {
  // Pinned card by click/tap (works great on both mobile and desktop)
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  // Hovered card (desktop instant preview)
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const togglePin = (id: string) => {
    setPinnedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* 3 Interactive Expandable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
        {partners.map((partner) => {
          const isExpanded = hoveredId === partner.id || pinnedId === partner.id;

          return (
            <div
              key={partner.id}
              onMouseEnter={() => setHoveredId(partner.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => togglePin(partner.id)}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer select-none ${isExpanded
                ? `shadow-xl ${partner.borderColor} ring-2 ring-sky-400/20 -translate-y-1`
                : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300'
                }`}
            >
              {/* Radial ambient glow effect */}
              <div
                className={`absolute -top-16 -right-16 w-36 h-36 ${partner.glowColor} rounded-full blur-2xl transition-opacity duration-300 pointer-events-none ${isExpanded ? 'opacity-100' : 'opacity-0'
                  }`}
              />

              {/* CARD TOP: Logo Box & Compact Title */}
              <div>
                {/* Elevated Logo Container */}
                <div
                  className={`w-full h-24 rounded-2xl flex items-center justify-center p-3 transition-all duration-300 ${isExpanded
                    ? 'bg-white shadow-xs border border-slate-100 scale-[1.02]'
                    : 'bg-slate-50/80 border border-slate-100 group-hover:bg-white group-hover:shadow-xs'
                    }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logo}
                    alt={partner.alt}
                    className={`max-h-14 sm:max-h-16 w-auto object-contain transition-transform duration-300 ${isExpanded ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                  />
                </div>

                {/* Institution Name & Interactive Action Pill */}
                <div className="mt-4 text-center">
                  <h3 className="text-base sm:text-lg font-bold text-[#00162d] font-heading group-hover:text-sky-700 transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{partner.sub}</p>


                </div>
              </div>

              {/* EXPANDABLE DRAWER: Opens smoothly on hover or tap */}
              <div
                className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5 pt-4 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0'
                  }`}
              >
                <div className="overflow-hidden">
                  {/* Role Badge */}
                  <div className="mb-3">
                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border ${partner.badgeStyle}`}>
                      {partner.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {partner.desc}
                  </p>

                  {/* Pillar Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {partner.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
