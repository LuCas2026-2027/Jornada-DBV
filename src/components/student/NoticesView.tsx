import { useState } from 'react';
import { SchoolNotice } from '../../types';
import { Bell, Calendar, Tag, User, Pin, ArrowRight } from 'lucide-react';

interface NoticesViewProps {
  notices: SchoolNotice[];
  selectedNoticeId?: string | null;
}

export function NoticesView({ notices, selectedNoticeId = null }: NoticesViewProps) {
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(selectedNoticeId);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'URGENTE':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'EVENTO':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ACADEMICO':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="notices-board-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900">Mural de Avisos da Escola</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Comunicados oficiais da Direção, datas comemorativas, provas e avisos gerais.
        </p>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((notice) => {
          const isExpanded = expandedNoticeId === notice.id;

          return (
            <div
              key={notice.id}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                notice.pinned ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-100 hover:border-purple-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        notice.category
                      )}`}
                    >
                      {notice.category}
                    </span>
                    {notice.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 rotate-45" />
                        <span>Fixado</span>
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{notice.publishDate}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {notice.title}
                </h3>

                <p
                  className={`text-xs text-slate-600 mt-2 leading-relaxed ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {notice.content}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Publicado por: <strong className="text-slate-700">{notice.author}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 transition cursor-pointer"
                >
                  {isExpanded ? 'Recolher' : 'Ler mais'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
