import { useState } from 'react';
import { ScheduleClass } from '../../types';
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';

interface ScheduleViewProps {
  schedule: ScheduleClass[];
}

export function ScheduleView({ schedule }: ScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<ScheduleClass['dayOfWeek']>('Segunda');

  const days: ScheduleClass['dayOfWeek'][] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  const dayClasses = schedule.filter((s) => s.dayOfWeek === selectedDay);

  return (
    <div id="schedule-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Horário Semanal de Aulas</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grade de aulas presenciais e salas para a turma do 3º Ano do Ensino Médio.
          </p>
        </div>

        {/* Days selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-2xl">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedDay === day
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Classes list for selected day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dayClasses.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-purple-200 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  Horário {idx + 1}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>{item.time}</span>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {item.subject}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.room}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.teacher}</span>
                </div>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
