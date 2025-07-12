import React, { useState, KeyboardEvent } from 'react';
import type { ItineraryPlan, TravelTip } from '../types';
import { IconFood, IconHotel, IconTip, IconMapPin, IconDownload, IconRestart, IconSun, IconMoon, IconInfo, IconWallet, IconEdit, IconBookmark, IconCheck, IconX } from './icons';
import { Logo } from './Logo';
import { TravelTipsModal } from './TravelTipsModal';


interface ItineraryDisplayProps {
  itinerary: ItineraryPlan;
  onReset: () => void;
  onExportPDF: () => void;
  onSaveToList: () => void;
  onItineraryChange: (newItinerary: ItineraryPlan) => void;
  onGoHome: () => void;
  isSaved: boolean;
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

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, onReset, onExportPDF, onSaveToList, onItineraryChange, onGoHome, isSaved }) => {
  const [activeTips, setActiveTips] = useState<{ tips: TravelTip[], venue: string } | null>(null);
  const [editingTime, setEditingTime] = useState<{ dayIndex: number, itemIndex: number} | null>(null);
  const [currentTimeValue, setCurrentTimeValue] = useState('');

  const handleEditClick = (dayIndex: number, itemIndex: number, time: string) => {
    setEditingTime({ dayIndex, itemIndex });
    setCurrentTimeValue(time);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTimeValue(e.target.value);
  };

  const handleTimeSave = (dayIndex: number, itemIndex: number) => {
    if (!itinerary) return;
    const newItinerary = JSON.parse(JSON.stringify(itinerary)); // Deep copy to avoid mutation issues
    newItinerary.timeline[dayIndex].schedule[itemIndex].time = currentTimeValue;
    onItineraryChange(newItinerary);
    setEditingTime(null);
  };
  
  const handleTimeCancel = () => {
    setEditingTime(null);
  };
  
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>, dayIndex: number, itemIndex: number) => {
    if (e.key === 'Enter') {
      handleTimeSave(dayIndex, itemIndex);
    } else if (e.key === 'Escape') {
      handleTimeCancel();
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 relative flex justify-between items-center">
          <Logo className="text-teal-700" onClick={onGoHome} />
          
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
             <h1 className="text-lg font-bold text-slate-700 flex items-center whitespace-nowrap">
                <IconMapPin className="w-5 h-5 mr-2 text-slate-500" />
                {itinerary.destination}
             </h1>
          </div>

          <div className="flex items-center space-x-3">
            {!isSaved && (
              <button onClick={onSaveToList} title="Lưu lại lịch trình" className="p-2.5 rounded-full bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 transform hover:scale-105 transition-all duration-300">
                <IconBookmark className="w-5 h-5" />
              </button>
            )}
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
             {itinerary.timeline.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-white rounded-xl shadow-lg p-6">
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
                        {day.schedule.map((item, itemIndex) => {
                            const isEditing = editingTime?.dayIndex === dayIndex && editingTime.itemIndex === itemIndex;
                            return (
                                <div key={itemIndex} className="relative mb-6 pl-4">
                                <div className="absolute -left-1.5 top-1 w-3 h-3 bg-teal-500 rounded-full border-2 border-white"></div>
                                
                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="text" 
                                        value={currentTimeValue}
                                        onChange={handleTimeChange}
                                        onKeyDown={(e) => handleInputKeyDown(e, dayIndex, itemIndex)}
                                        autoFocus
                                        className="font-bold text-slate-700 bg-slate-100 rounded px-2 py-1 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                      />
                                      <button onClick={() => handleTimeSave(dayIndex, itemIndex)} className="text-green-500 hover:text-green-700"><IconCheck className="w-5 h-5"/></button>
                                      <button onClick={handleTimeCancel} className="text-red-500 hover:text-red-700"><IconX className="w-5 h-5"/></button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="font-bold text-slate-700">{item.time}</p>
                                      <button onClick={() => handleEditClick(dayIndex, itemIndex, item.time)} className="text-slate-400 hover:text-teal-600">
                                        <IconEdit className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>

                                <p className="text-slate-600 mb-2">{item.activity}</p>
                                <div className="space-y-2 text-sm">
                                  {item.venue && (
                                      <div className="flex items-center text-slate-500">
                                          <IconMapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                          {item.google_maps_link ? (
                                              <a 
                                                  href={item.google_maps_link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="hover:underline hover:text-teal-600 transition-colors font-medium"
                                                  title={`Mở vị trí của ${item.venue} trên Google Maps`}
                                              >
                                                  {item.venue}
                                              </a>
                                          ) : (
                                              <span>{item.venue}</span>
                                          )}
                                      </div>
                                  )}
                                  {item.estimated_cost && (
                                      <div className="flex items-center text-slate-500">
                                          <IconWallet className="w-4 h-4 mr-2 flex-shrink-0" />
                                          <span>Chi phí: {item.estimated_cost}</span>
                                      </div>
                                  )}
                                  {item.travel_tips && item.travel_tips.length > 0 && (
                                      <div className="pt-1">
                                          <button
                                              onClick={() => setActiveTips({ tips: item.travel_tips as TravelTip[], venue: item.venue || 'địa điểm' })}
                                              className="inline-flex items-center text-xs bg-teal-50 text-teal-600 font-semibold px-2.5 py-1 rounded-full hover:bg-teal-100 transition-transform transform hover:scale-105"
                                              title="Xem mẹo di chuyển"
                                          >
                                              <IconTip className="w-4 h-4 mr-1.5" />
                                              Mẹo di chuyển
                                          </button>
                                      </div>
                                  )}
                                </div>
                              </div>
                            )
                        })}
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
      
      {activeTips && (
          <TravelTipsModal
              tips={activeTips.tips}
              venue={activeTips.venue}
              onClose={() => setActiveTips(null)}
          />
      )}
    </div>
  );
};