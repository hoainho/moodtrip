import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { ItineraryPlan, TravelTip } from '../types';
import { IconFood, IconHotel, IconTip, IconMapPin, IconDownload, IconRestart, IconSun, IconMoon, IconInfo, IconWallet, IconEdit, IconBookmark, IconCheck, IconX, IconThermometer, IconCloudSun, IconShirt, IconAlertTriangle, IconConstruction, IconReceipt, IconFire, IconShare, IconClock, IconHeart } from './icons';
import { Logo } from './Logo';
import { TravelTipsModal } from './TravelTipsModal';
import { motion } from 'motion/react';
import { ShareModal } from './ShareModal';
import { hapticLight, hapticMedium } from '../services/haptics';
import { TripRecap } from './TripRecap';

interface ItineraryDisplayProps {
  itinerary: ItineraryPlan;
  onReset: () => void;
  onExportPDF: () => void;
  onSaveToList: () => void;
  onItineraryChange: (newItinerary: ItineraryPlan) => void;
  onGoHome: () => void;
  isSaved: boolean;
  isExportingPDF?: boolean;
}

const InfoCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.4 }}
      className="glass-dark rounded-3xl p-6 transition-all duration-300 border border-white/5 hover:border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/5"
    >
        <div className="flex items-center mb-4">
            <div className="gradient-nature text-white rounded-full p-2.5 mr-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div>{children}</div>
    </motion.div>
);

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, onReset, onExportPDF, onSaveToList, onItineraryChange, onGoHome, isSaved, isExportingPDF }) => {
  const [activeTips, setActiveTips] = useState<{ tips: TravelTip[], venue: string } | null>(null);
  const [editingTime, setEditingTime] = useState<{ dayIndex: number, itemIndex: number} | null>(null);
  const [currentTimeValue, setCurrentTimeValue] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeSection, setActiveSection] = useState('timeline');
  const [showRecap, setShowRecap] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    hapticLight();
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sections = [
    { id: 'timeline', label: 'Lịch trình', icon: <IconMapPin className="w-4 h-4" /> },
    { id: 'food', label: 'Ẩm thực', icon: <IconFood className="w-4 h-4" /> },
    ...(itinerary.accommodation && itinerary.accommodation.length > 0 ? [{ id: 'accommodation', label: 'Chỗ nghỉ', icon: <IconHotel className="w-4 h-4" /> }] : []),
    { id: 'tips', label: 'Mẹo', icon: <IconTip className="w-4 h-4" /> },
    ...(itinerary.packing_suggestions && itinerary.packing_suggestions.length > 0 ? [{ id: 'packing', label: 'Hành lý', icon: <IconShirt className="w-4 h-4" /> }] : []),
    ...(itinerary.traffic_alerts && itinerary.traffic_alerts.length > 0 ? [{ id: 'traffic', label: 'Giao thông', icon: <IconConstruction className="w-4 h-4" /> }] : []),
    ...(itinerary.safety_alerts && itinerary.safety_alerts.length > 0 ? [{ id: 'safety', label: 'An toàn', icon: <IconAlertTriangle className="w-4 h-4" /> }] : []),
    ...(itinerary.budget_summary ? [{ id: 'budget', label: 'Chi phí', icon: <IconReceipt className="w-4 h-4" /> }] : []),
  ];

  // Live Trip Mode
  const [liveModeEnabled, setLiveModeEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!liveModeEnabled) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [liveModeEnabled]);

  const parseTimeToMinutes = (timeStr: string): number | null => {
    // Parse time formats like '08:00', '8:00', '08h00', '14:30'
    const match = timeStr.match(/(\d{1,2})[h:]?(\d{2})/);
    if (!match) return null;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  const getCurrentMinutes = (): number => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  };

  const getActivityStatus = (dayIndex: number, itemIndex: number): 'past' | 'current' | 'upcoming' | 'none' => {
    if (!liveModeEnabled) return 'none';
    // Only highlight first day for simplicity (or if trip has a single day)
    if (dayIndex !== 0) return 'none';
    const schedule = itinerary.timeline[dayIndex]?.schedule;
    if (!schedule) return 'none';
    
    const nowMinutes = getCurrentMinutes();
    const itemTime = parseTimeToMinutes(schedule[itemIndex].time);
    if (itemTime === null) return 'none';
    
    const nextItemTime = itemIndex < schedule.length - 1
      ? parseTimeToMinutes(schedule[itemIndex + 1].time)
      : null;

    if (nextItemTime !== null && nowMinutes >= itemTime && nowMinutes < nextItemTime) return 'current';
    if (nextItemTime === null && nowMinutes >= itemTime) return 'current';
    if (nowMinutes < itemTime) return 'upcoming';
    return 'past';
  };

  const getCountdown = (dayIndex: number, itemIndex: number): string | null => {
    if (!liveModeEnabled || dayIndex !== 0) return null;
    const schedule = itinerary.timeline[dayIndex]?.schedule;
    if (!schedule) return null;
    const itemTime = parseTimeToMinutes(schedule[itemIndex].time);
    if (itemTime === null) return null;
    const nowMinutes = getCurrentMinutes();
    const diff = itemTime - nowMinutes;
    if (diff <= 0 || diff > 480) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0) return `c\u00f2n ${hours}h${mins > 0 ? mins + 'p' : ''}`;
    return `c\u00f2n ${mins} ph\u00fat`;
  };

  const handleEditClick = (dayIndex: number, itemIndex: number, time: string) => {
    setEditingTime({ dayIndex, itemIndex });
    setCurrentTimeValue(time);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTimeValue(e.target.value);
  };

  const handleTimeSave = (dayIndex: number, itemIndex: number) => {
    if (!itinerary) return;
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[rgba(10,14,26,0.85)] backdrop-blur-xl border-b border-white/[0.06]">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
          <Logo className="text-white flex-shrink-0" onClick={onGoHome} />
          <h1 className="flex-1 min-w-0 text-sm sm:text-base font-semibold text-white/90 flex items-center">
            <IconMapPin className="w-4 h-4 mr-1.5 text-teal-400 flex-shrink-0" />
            <span className="truncate">{itinerary.destination}</span>
          </h1>
        </div>
      </header>

      <main id="itinerary-to-print" className="container mx-auto p-4 md:p-8">
        {/* Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="gradient-ocean text-white rounded-2xl p-8 mb-8 text-center shadow-xl shadow-cyan-500/10 border border-white/10"
        >
          <h2 className="text-3xl font-bold mb-4">Hành trình của bạn đã sẵn sàng!</h2>
          <p className="text-lg opacity-90 max-w-3xl mx-auto leading-relaxed">{itinerary.overview}</p>
        </motion.div>

        {/* Section Navigation Tabs */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 min-w-max py-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap border ${
                  activeSection === section.id
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30 shadow-lg shadow-teal-500/10'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.04] hover:bg-white/10 hover:text-white'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Timeline */}
          <div ref={el => { sectionRefs.current['timeline'] = el; }} className="md:col-span-2 space-y-8 scroll-mt-20">
             {itinerary.timeline.map((day, dayIndex) => (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: dayIndex * 0.15 }}
                  className="glass-dark rounded-3xl p-6 border border-white/5"
                >
                   <div className="flex items-center mb-4 border-b pb-3 border-white/10">
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 gradient-nature rounded-full mr-4">
                          {day.title.toLowerCase().includes('toi') || day.title.toLowerCase().includes('dem') ? <IconMoon className="w-6 h-6 text-white"/> : <IconSun className="w-6 h-6 text-white"/>}
                      </div>
                      <div>
                          <p className="font-medium text-slate-400 text-sm">{day.day}</p>
                          <h3 className="text-2xl font-bold text-white">{day.title}</h3>
                      </div>
                   </div>
                   
                   {(day.weather_note || day.weather) && (
                        <div className="mb-4 space-y-2">
                          {day.weather && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="flex items-center gap-2 bg-sky-500/10 rounded-lg px-3 py-2 border border-sky-500/15">
                                <IconThermometer className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                <span className="text-sky-200 text-xs font-medium">{day.weather.temperature}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-sky-500/10 rounded-lg px-3 py-2 border border-sky-500/15">
                                <IconCloudSun className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                <span className="text-sky-200 text-xs font-medium">{day.weather.condition}</span>
                              </div>
                              {day.weather.humidity && (
                                <div className="flex items-center gap-2 bg-sky-500/10 rounded-lg px-3 py-2 border border-sky-500/15">
                                  <IconInfo className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                  <span className="text-sky-200 text-xs font-medium">{day.weather.humidity}</span>
                                </div>
                              )}
                              {day.weather.wind && (
                                <div className="flex items-center gap-2 bg-sky-500/10 rounded-lg px-3 py-2 border border-sky-500/15">
                                  <IconInfo className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                  <span className="text-sky-200 text-xs font-medium">{day.weather.wind}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {(day.weather?.note || day.weather_note) && (
                            <div className="flex items-start bg-sky-500/10 text-sky-300 rounded-xl p-3 text-sm border border-sky-500/20">
                              <IconInfo className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-sky-400" />
                              <p>{day.weather?.note || day.weather_note}</p>
                            </div>
                          )}
                        </div>
                   )}
                   
                   <div className="relative pl-6">
                        <div className="absolute left-0 top-0 h-full w-0.5 bg-teal-900"></div>
                        {day.schedule.map((item, itemIndex) => {
                            const isEditing = editingTime?.dayIndex === dayIndex && editingTime.itemIndex === itemIndex;
                            const activityStatus = getActivityStatus(dayIndex, itemIndex);
                            const countdown = getCountdown(dayIndex, itemIndex);
                            return (
                                <motion.div
                                  key={itemIndex}
                                  initial={{ opacity: 0, x: -15 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: itemIndex * 0.08 }}
                                  className={`relative mb-6 pl-4 ${activityStatus === 'current' ? 'bg-teal-500/5 -mx-2 px-6 py-3 rounded-2xl border border-teal-500/20' : ''} ${activityStatus === 'past' ? 'opacity-50' : ''}`}
                                >
                                <div className={`absolute ${activityStatus === 'current' ? '-left-0.5' : '-left-1.5'} top-1 w-3 h-3 rounded-full border-2 border-[#0a0e1a] ${
                                  activityStatus === 'current' ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' :
                                  activityStatus === 'past' ? 'bg-slate-600' : 'bg-teal-500 shadow-lg shadow-teal-500/30'
                                }`}></div>
                                
                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="text" 
                                        value={currentTimeValue}
                                        onChange={handleTimeChange}
                                        onKeyDown={(e) => handleInputKeyDown(e, dayIndex, itemIndex)}
                                        autoFocus
                                        className="font-bold text-white bg-white/10 rounded-lg px-3 py-1.5 border border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                                      />
                                      <button onClick={() => handleTimeSave(dayIndex, itemIndex)} className="text-green-400 hover:text-green-300 transition"><IconCheck className="w-5 h-5"/></button>
                                      <button onClick={handleTimeCancel} className="text-red-400 hover:text-red-300 transition"><IconX className="w-5 h-5"/></button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="font-bold text-white">{item.time}</p>
                                      {activityStatus === 'current' && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                          LIVE
                                        </span>
                                      )}
                                      {countdown && activityStatus === 'upcoming' && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                          <IconClock className="w-3 h-3" />
                                          {countdown}
                                        </span>
                                      )}
                                      <button onClick={() => handleEditClick(dayIndex, itemIndex, item.time)} className="text-slate-600 hover:text-teal-400 transition">
                                        <IconEdit className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>

                                <p className="text-slate-300 mb-2">{item.activity}</p>
                                {item.is_trending && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                                      <IconFire className="w-3.5 h-3.5" />
                                      Trending
                                    </span>
                                    {item.trending_reason && (
                                      <span className="text-xs text-orange-300/70">{item.trending_reason}</span>
                                    )}
                                  </div>
                                )}
                                <div className="space-y-2 text-sm">
                                  {item.venue && (
                                      <div className="flex items-center text-slate-400">
                                          <IconMapPin className="w-4 h-4 mr-2 flex-shrink-0 text-teal-500" />
                                          {item.google_maps_link ? (
                                              <a 
                                                  href={item.google_maps_link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="hover:underline hover:text-teal-400 transition-colors font-medium"
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
                                      <div className="flex items-center text-slate-400">
                                          <IconWallet className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-500" />
                                          <span>Chi phi: {item.estimated_cost}</span>
                                      </div>
                                  )}
                                  {item.travel_tips && item.travel_tips.length > 0 && (
                                      <div className="pt-1">
                                          <button
                                              onClick={() => setActiveTips({ tips: item.travel_tips as TravelTip[], venue: item.venue || 'địa điểm' })}
                                              className="inline-flex items-center text-xs bg-teal-500/10 text-teal-400 font-semibold px-3 py-1.5 rounded-full hover:bg-teal-500/20 transition-all border border-teal-500/20"
                                              title="Xem mẹo di chuyển"
                                          >
                                              <IconTip className="w-4 h-4 mr-1.5" />
                                              Mẹo di chuyển
                                          </button>
                                      </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                        })}
                   </div>
                </motion.div>
             ))}
          </div>

          {/* Food */}
          <div ref={el => { sectionRefs.current['food'] = el; }} className="scroll-mt-20">
          <InfoCard icon={<IconFood className="w-6 h-6"/>} title="Món ăn nên thử">
            <ul className="space-y-3">
              {itinerary.food.map((item, index) => (
                <li key={index} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </li>
              ))}
            </ul>
          </InfoCard>
          </div>
          {/* Accommodation */}
          {itinerary.accommodation && itinerary.accommodation.length > 0 && (
          <div ref={el => { sectionRefs.current['accommodation'] = el; }} className="scroll-mt-20">
            <InfoCard icon={<IconHotel className="w-6 h-6"/>} title="Gợi ý chỗ nghỉ">
              <ul className="space-y-3">
                {itinerary.accommodation.map((item, index) => (
                  <li key={index} className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="font-bold text-white">{item.name} <span className="text-sm font-normal text-slate-500">({item.type})</span></p>
                    <p className="text-sm text-slate-400">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>
          )}

          {/* Tips */}
          <div ref={el => { sectionRefs.current['tips'] = el; }} className="md:col-span-2 scroll-mt-20">
            <InfoCard icon={<IconTip className="w-6 h-6"/>} title="Mẹo du lịch hữu ích">
              <ul className="space-y-2 text-slate-300">
                {itinerary.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 p-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>

          {/* Packing Suggestions */}
          {itinerary.packing_suggestions && itinerary.packing_suggestions.length > 0 && (
          <div ref={el => { sectionRefs.current['packing'] = el; }} className="scroll-mt-20">
            <InfoCard icon={<IconShirt className="w-6 h-6"/>} title="Gợi ý trang phục & phụ kiện">
              <ul className="space-y-3">
                {itinerary.packing_suggestions.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <IconShirt className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white text-sm">{item.item}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>
          )}

          {/* Traffic Alerts */}
          {itinerary.traffic_alerts && itinerary.traffic_alerts.length > 0 && (
          <div ref={el => { sectionRefs.current['traffic'] = el; }} className="scroll-mt-20">
            <InfoCard icon={<IconConstruction className="w-6 h-6"/>} title="Cảnh báo giao thông">
              <ul className="space-y-3">
                {itinerary.traffic_alerts.map((alert, index) => (
                  <li key={index} className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/15">
                    <div className="flex items-center gap-2 mb-1">
                      <IconAlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="font-semibold text-amber-300 text-sm">{alert.area}</p>
                    </div>
                    <p className="text-xs text-slate-300 mb-1">{alert.issue}</p>
                    <p className="text-xs text-teal-400">Gợi ý: {alert.suggestion}</p>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>
          )}

          {/* Safety Alerts */}
          {itinerary.safety_alerts && itinerary.safety_alerts.length > 0 && (
          <div ref={el => { sectionRefs.current['safety'] = el; }} className="md:col-span-2 scroll-mt-20">
              <InfoCard icon={<IconAlertTriangle className="w-6 h-6"/>} title="Lưu ý an toàn & sự kiện">
                <ul className="space-y-3">
                  {itinerary.safety_alerts.map((alert, index) => {
                    const typeStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
                      festival: { bg: 'bg-purple-500/10', border: 'border-purple-500/15', text: 'text-purple-300', label: 'Lễ hội' },
                      religious: { bg: 'bg-amber-500/10', border: 'border-amber-500/15', text: 'text-amber-300', label: 'Tôn giáo' },
                      safety: { bg: 'bg-red-500/10', border: 'border-red-500/15', text: 'text-red-300', label: 'An ninh' },
                      event: { bg: 'bg-blue-500/10', border: 'border-blue-500/15', text: 'text-blue-300', label: 'Sự kiện' },
                    };
                    const style = typeStyles[alert.type] || typeStyles.event;
                    return (
                      <li key={index} className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 ${style.text}`}>{style.label}</span>
                          <p className={`font-semibold text-sm ${style.text}`}>{alert.title}</p>
                        </div>
                        <p className="text-xs text-slate-300 mb-1.5">{alert.description}</p>
                        <p className="text-xs text-teal-400">Lời khuyên: {alert.advice}</p>
                      </li>
                    );
                  })}
                </ul>
              </InfoCard>
          </div>
          )}

          {/* Budget Summary */}
          {itinerary.budget_summary && (
          <div ref={el => { sectionRefs.current['budget'] = el; }} className="md:col-span-2 scroll-mt-20">
              <InfoCard icon={<IconReceipt className="w-6 h-6"/>} title="Tổng hợp chi phí">
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2.5 px-3 text-teal-400 font-semibold">Hạng mục</th>
                          <th className="text-right py-2.5 px-3 text-teal-400 font-semibold">Chi phí</th>
                          <th className="text-left py-2.5 px-3 text-teal-400 font-semibold hidden sm:table-cell">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itinerary.budget_summary.breakdown.map((item, index) => (
                          <tr key={index} className="border-b border-white/5">
                            <td className="py-2.5 px-3 text-slate-300">{item.category}</td>
                            <td className="py-2.5 px-3 text-white font-medium text-right">{item.amount}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-xs hidden sm:table-cell">{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-teal-500/30">
                          <td className="py-3 px-3 text-white font-bold">Tổng cộng</td>
                          <td className="py-3 px-3 text-teal-400 font-bold text-right text-lg">{itinerary.budget_summary.total_estimated}</td>
                          <td className="py-3 px-3 hidden sm:table-cell"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex items-start bg-teal-500/10 text-teal-300 rounded-xl p-3 text-sm border border-teal-500/20">
                    <IconWallet className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-teal-400" />
                    <p>{itinerary.budget_summary.vs_budget_note}</p>
                  </div>
                </div>
              </InfoCard>
          </div>
          )}
        </div>
      </main>
      
      {activeTips && (
          <TravelTipsModal
              tips={activeTips.tips}
              venue={activeTips.venue}
              onClose={() => setActiveTips(null)}
          />
      )}

      {showShareModal && (
        <ShareModal
          itinerary={itinerary}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showRecap && (
        <TripRecap
          itinerary={itinerary}
          onClose={() => setShowRecap(false)}
        />
      )}

      {/* Floating Action Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-40"
      >
        <div className="bg-[rgba(10,14,26,0.9)] backdrop-blur-xl border-t border-white/[0.06]">
          <div className="container mx-auto px-2 sm:px-4 py-2 pb-safe flex items-center justify-around max-w-lg">
            {/* Save */}
            {!isSaved ? (
              <motion.button
                onClick={onSaveToList}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center gap-0.5 group"
              >
                <div className="p-2 sm:p-2.5 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/15 group-hover:bg-yellow-500/20 transition-all">
                  <IconBookmark className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-yellow-400/60 font-medium">Lưu</span>
              </motion.button>
            ) : (
              <div className="flex flex-col items-center gap-0.5 opacity-40">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/15">
                  <IconCheck className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-green-400/60 font-medium">Đã lưu</span>
              </div>
            )}

            {/* PDF Export */}
            <motion.button
              onClick={onExportPDF}
              disabled={isExportingPDF}
              whileHover={isExportingPDF ? {} : { scale: 1.1 }}
              whileTap={isExportingPDF ? {} : { scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className={`p-2 sm:p-2.5 rounded-2xl border transition-all ${isExportingPDF ? 'bg-teal-500/5 text-teal-400/40 border-teal-500/10 cursor-wait' : 'bg-teal-500/10 text-teal-400 border-teal-500/15 group-hover:bg-teal-500/20'}`}>
                {isExportingPDF ? (
                  <svg className="w-[18px] h-[18px] sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <IconDownload className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-medium ${isExportingPDF ? 'text-teal-400/40' : 'text-teal-400/60'}`}>PDF</span>
            </motion.button>

            {/* Share */}
            <motion.button
              onClick={() => { hapticMedium(); setShowShareModal(true); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className="p-2 sm:p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 group-hover:bg-cyan-500/20 transition-all">
                <IconShare className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-cyan-400/60 font-medium">Chia sẻ</span>
            </motion.button>

            {/* Recap */}
            <motion.button
              onClick={() => setShowRecap(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/15 group-hover:bg-purple-500/20 transition-all">
                <IconHeart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-purple-400/60 font-medium">Kỷ niệm</span>
            </motion.button>

            {/* New Trip */}
            <motion.button
              onClick={onReset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className="p-2 sm:p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/15 group-hover:bg-red-500/20 transition-all">
                <IconRestart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-red-400/60 font-medium">Mới</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
