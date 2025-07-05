import React from 'react';
import type { ItineraryPlan } from '../types';
import { IconFood, IconHotel, IconTip, IconMapPin, IconDownload, IconRestart, IconSun, IconMoon, IconInfo, IconWallet } from './icons';
import { Logo } from './Logo';

interface ItineraryDisplayProps {
  itinerary: ItineraryPlan;
  onReset: () => void;
  onExportPDF: () => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
        <div className="flex items-center mb-4">
            <div className="bg-teal-100 text-teal-600 rounded-full p-2 mr-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-teal-800">{title}</h3>
        </div>
        <div>{children}</div>
    </div>
);

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, onReset, onExportPDF }) => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 relative flex justify-between items-center">
          <Logo className="text-teal-700" />
          
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
             <h1 className="text-lg font-bold text-slate-700 flex items-center whitespace-nowrap">
                <IconMapPin className="w-5 h-5 mr-2 text-slate-500" />
                {itinerary.destination}
             </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={onExportPDF} title="Xuất ra PDF" className="p-2.5 rounded-full bg-teal-500 text-white shadow-lg hover:bg-teal-600 transform hover:scale-105 transition-all duration-300">
              <IconDownload className="w-5 h-5" />
            </button>
            <button onClick={onReset} title="Tạo chuyến đi mới" className="p-2.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transform hover:scale-105 transition-all duration-300">
              <IconRestart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="itinerary-to-print" className="container mx-auto p-4 md:p-8">
        {/* Overview */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl p-8 mb-8 text-center shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Hành trình của bạn đã sẵn sàng!</h2>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">{itinerary.overview}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Timeline */}
          <div className="md:col-span-2 space-y-8">
             {itinerary.timeline.map((day, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                   <div className="flex items-center mb-4 border-b pb-3 border-slate-200">
                      <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mr-4">
                          {day.title.toLowerCase().includes('tối') || day.title.toLowerCase().includes('đêm') ? <IconMoon className="w-6 h-6 text-teal-600"/> : <IconSun className="w-6 h-6 text-teal-600"/>}
                      </div>
                      <div>
                          <p className="font-semibold text-slate-500">{day.day}</p>
                          <h3 className="text-2xl font-bold text-teal-800">{day.title}</h3>
                      </div>
                   </div>
                   
                   {day.weather_note && (
                        <div className="flex items-start bg-sky-50 text-sky-800 rounded-lg p-3 mb-4 text-sm">
                           <IconInfo className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-sky-600" />
                           <p>{day.weather_note}</p>
                        </div>
                   )}
                   
                   <div className="relative pl-6">
                        <div className="absolute left-0 top-0 h-full w-0.5 bg-teal-200"></div>
                        {day.schedule.map((item, itemIndex) => (
                           <div key={itemIndex} className="relative mb-6 pl-4">
                              <div className="absolute -left-1.5 top-1 w-3 h-3 bg-teal-500 rounded-full border-2 border-white"></div>
                              <p className="font-bold text-slate-700">{item.time}</p>
                              <p className="text-slate-600 mb-2">{item.activity}</p>
                              <div className="space-y-1 text-sm">
                                {item.venue && (
                                    <div className="flex items-center text-slate-500">
                                        <IconMapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span>{item.venue}</span>
                                    </div>
                                )}
                                {item.estimated_cost && (
                                    <div className="flex items-center text-slate-500">
                                        <IconWallet className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span>Chi phí: {item.estimated_cost}</span>
                                    </div>
                                )}
                              </div>
                           </div>
                        ))}
                   </div>
                </div>
             ))}
          </div>

          {/* Food */}
          <InfoCard icon={<IconFood className="w-6 h-6"/>} title="Món ăn nên thử">
            <ul className="space-y-3">
              {itinerary.food.map((item, index) => (
                <li key={index} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </li>
              ))}
            </ul>
          </InfoCard>

          {/* Accommodation */}
          <InfoCard icon={<IconHotel className="w-6 h-6"/>} title="Gợi ý chỗ nghỉ">
            <ul className="space-y-3">
              {itinerary.accommodation.map((item, index) => (
                <li key={index} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-bold text-slate-800">{item.name} <span className="text-sm font-normal text-slate-500">({item.type})</span></p>
                  <p className="text-sm text-slate-600">{item.reason}</p>
                </li>
              ))}
            </ul>
          </InfoCard>

          {/* Tips */}
          <div className="md:col-span-2">
            <InfoCard icon={<IconTip className="w-6 h-6"/>} title="Mẹo du lịch hữu ích">
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                {itinerary.tips.map((tip, index) => <li key={index}>{tip}</li>)}
              </ul>
            </InfoCard>
          </div>
        </div>
      </main>
    </div>
  );
};