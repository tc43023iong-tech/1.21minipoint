
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Student, 
  ClassData, 
  SortType 
} from './types';
import { 
  INITIAL_CLASSES, 
  POSITIVE_ACTIONS, 
  NEGATIVE_ACTIONS, 
  POKEMON_COUNT, 
  POKEMON_NAMES
} from './constants';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>(() => {
    const saved = localStorage.getItem('miss_iong_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0].id);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [sortType, setSortType] = useState<SortType>(SortType.ID);
  
  // Modals
  const [showPokemonPicker, setShowPokemonPicker] = useState<number | null>(null); // student ID
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{
    students: { name: string, id: number, pokemonId: number, newTotal: number }[],
    points: number,
    reason: string,
    isPositive: boolean
  } | null>(null);
  const [showRandomPicker, setShowRandomPicker] = useState<boolean>(false);
  const [randomPickResult, setRandomPickResult] = useState<Student | null>(null);
  const [pickedHistory, setPickedHistory] = useState<number[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [flashingStudent, setFlashingStudent] = useState<Student | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [manualInput, setManualInput] = useState<string>('');

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  useEffect(() => {
    localStorage.setItem('miss_iong_classes', JSON.stringify(classes));
  }, [classes]);

  const updateStudent = useCallback((studentId: number, updates: Partial<Student>) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === selectedClassId) {
        return {
          ...cls,
          students: cls.students.map(s => s.id === studentId ? { ...s, ...updates } : s)
        };
      }
      return cls;
    }));
  }, [selectedClassId]);

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const applyPoints = (targets: Student[], amount: number, reason: string) => {
    const isPositive = amount > 0;
    
    const resultDetails = targets.map(s => ({
      id: s.id,
      name: s.name,
      pokemonId: s.pokemonId,
      newTotal: s.points + amount
    }));

    setClasses(prev => prev.map(cls => {
      if (cls.id === selectedClassId) {
        return {
          ...cls,
          students: cls.students.map(s => {
            if (targets.find(target => target.id === s.id)) {
              return {
                ...s,
                points: s.points + amount,
                plusPoints: isPositive ? s.plusPoints + amount : s.plusPoints,
                minusPoints: !isPositive ? s.minusPoints + Math.abs(amount) : s.minusPoints
              };
            }
            return s;
          })
        };
      }
      return cls;
    }));

    setScoreResult({ students: resultDetails, points: amount, reason, isPositive });
    if (isPositive) audioService.playPlus();
    else audioService.playMinus();

    setTimeout(() => setScoreResult(null), 2000);
    
    setSelectedStudents([]);
    setShowScoreModal(false);
    setManualInput('');
  };

  const handleRandomPick = () => {
    if (isPicking) return;
    setIsPicking(true);
    setRandomPickResult(null);
    setShowRandomPicker(true);

    const available = currentClass.students.filter(s => !pickedHistory.includes(s.id));
    const pool = available.length > 0 ? available : currentClass.students;
    
    if (available.length === 0) setPickedHistory([]);

    let duration = 0;
    const interval = setInterval(() => {
      const randomS = currentClass.students[Math.floor(Math.random() * currentClass.students.length)];
      setFlashingStudent(randomS);
      audioService.playTenseTick();
      duration += 100;
      if (duration >= 2000) {
        clearInterval(interval);
        const final = pool[Math.floor(Math.random() * pool.length)];
        setRandomPickResult(final);
        setPickedHistory(prev => [...prev, final.id]);
        setIsPicking(false);
      }
    }, 100);
  };

  const exportData = () => {
    const data = JSON.stringify(classes, null, 2);
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Miss_Iong_Class_Data_${new Date().toLocaleDateString()}.txt`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setClasses(imported);
        alert('Data imported successfully! / 數據導入成功！');
      } catch (err) {
        alert('Invalid file format. / 文件格式錯誤。');
      }
    };
    reader.readAsText(file);
  };

  const sortedStudents = [...currentClass.students].sort((a, b) => {
    if (sortType === SortType.ID) return a.id - b.id;
    if (sortType === SortType.SCORE_HI_LO) return b.points - a.points;
    if (sortType === SortType.SCORE_LO_HI) return a.points - b.points;
    return 0;
  });

  const currentlySelectedStudents = currentClass.students.filter(s => selectedStudents.includes(s.id));

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:px-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border-4 border-pink-200">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold text-pink-600 drop-shadow-sm">Miss Iong's Class</h1>
          <p className="text-pink-400 font-semibold mt-1">⭐ Point Management System / 學生積分系統 ⭐</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0 items-center justify-center">
          <div className="relative group mr-2">
            <select 
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudents([]);
              }}
              className="appearance-none bg-yellow-400 text-white px-6 py-2.5 rounded-full font-bold hover:bg-yellow-500 transition shadow-md outline-none cursor-pointer pr-10 border-none"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id} className="text-gray-800 bg-white font-bold">
                  {cls.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          <button onClick={exportData} className="px-4 py-2 bg-blue-400 text-white rounded-full font-bold hover:bg-blue-500 transition shadow-md">
            📤 EXPORT / 導出
          </button>
          <label className="px-4 py-2 bg-green-400 text-white rounded-full font-bold hover:bg-green-500 transition cursor-pointer shadow-md">
            📥 IMPORT / 導入
            <input type="file" className="hidden" onChange={importData} accept=".txt" />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 p-4 rounded-2xl border-2 border-pink-100 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSortType(SortType.ID)}
              className={`px-4 py-1 rounded-full font-bold transition text-sm ${sortType === SortType.ID ? 'bg-pink-400 text-white shadow-md' : 'bg-pink-50 text-pink-400'}`}
            >
              # ID / 學號
            </button>
            <button 
              onClick={() => setSortType(SortType.SCORE_HI_LO)}
              className={`px-4 py-1 rounded-full font-bold transition text-sm ${sortType === SortType.SCORE_HI_LO ? 'bg-pink-400 text-white shadow-md' : 'bg-pink-50 text-pink-400'}`}
            >
              HI-LO / 高到低
            </button>
            <button 
              onClick={() => setSortType(SortType.SCORE_LO_HI)}
              className={`px-4 py-1 rounded-full font-bold transition text-sm ${sortType === SortType.SCORE_LO_HI ? 'bg-pink-400 text-white shadow-md' : 'bg-pink-50 text-pink-400'}`}
            >
              LO-HI / 低到高
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-full border border-purple-100">
              <button 
                onClick={() => setSelectedStudents(currentClass.students.map(s => s.id))}
                className="px-3 py-1 bg-purple-400 text-white text-xs font-bold rounded-full hover:bg-purple-500 transition shadow-sm"
              >
                全選
              </button>
              <button 
                onClick={() => setSelectedStudents([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-300 transition shadow-sm"
              >
                取消
              </button>
            </div>

            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-full border border-red-100">
              <button 
                onClick={handleRandomPick}
                className="px-3 py-1 bg-red-400 text-white text-xs font-bold rounded-full hover:bg-red-500 transition shadow-sm"
              >
                隨機 ({pickedHistory.length}/{currentClass.students.length})
              </button>
              <button 
                onClick={() => setPickedHistory([])}
                title="Reset Picked History"
                className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-300 transition shadow-sm"
              >
                🔄
              </button>
            </div>

            <button 
              disabled={selectedStudents.length === 0}
              onClick={() => setShowScoreModal(true)}
              className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-md transition-all ${
                selectedStudents.length > 0 
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:scale-105 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              獎懲評分 ({selectedStudents.length})
            </button>

            <button 
              onClick={() => setShowRules(true)}
              className="w-9 h-9 flex items-center justify-center bg-yellow-400 text-white rounded-full text-lg shadow-md hover:scale-110 transition"
            >
              🔔
            </button>
          </div>
        </div>

        {/* Student Grid Container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-6">
          {sortedStudents.map((student, idx) => {
            const isSelected = selectedStudents.includes(student.id);
            return (
              <div 
                key={student.id}
                onClick={() => toggleStudentSelection(student.id)}
                className={`relative bg-white rounded-[2.5rem] p-4 transition-all cursor-pointer group hover:scale-[1.03] flex flex-col items-center ${
                  isSelected 
                  ? 'ring-4 ring-pink-400 shadow-pink-200 shadow-xl bg-pink-50' 
                  : 'shadow-xl shadow-pink-100/30'
                }`}
              >
                {/* Tick Icon in Top Right */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-4 border-white z-20 animate-in zoom-in duration-200">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Ranking Badge */}
                {(sortType === SortType.SCORE_HI_LO || sortType === SortType.SCORE_LO_HI) && (
                  <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md border-2 z-10 text-base
                    ${idx === 0 ? 'bg-yellow-400 text-white border-yellow-200' : 
                      idx === 1 ? 'bg-slate-300 text-white border-slate-100' :
                      idx === 2 ? 'bg-amber-600 text-white border-amber-400' :
                      'bg-pink-100 text-pink-500 border-white'}`}>
                    {idx + 1}
                  </div>
                )}

                {/* Pokemon Image */}
                <div className="relative w-20 h-20 mb-2 group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${student.pokemonId}.png`}
                    alt="Pokemon"
                    className="w-full h-full object-contain pixelated"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPokemonPicker(student.id);
                    }}
                  />
                </div>

                {/* ID, Name and Point Badge Container */}
                <div className="w-full flex justify-between items-center mb-4 px-1">
                  <div className="text-left flex-1 truncate mr-1">
                    <div className="text-pink-500 font-black text-xs md:text-sm">
                      #{student.id}
                    </div>
                    <h3 className="text-lg font-black text-[#2c3e50] truncate">
                      {student.name}
                    </h3>
                  </div>

                  <div className="bg-[#fff9db] text-[#916912] rounded-xl px-2 py-1 flex flex-col items-center gap-0 font-black shadow-sm border border-[#fff3bf] shrink-0">
                    <span className="text-[#bf9106] text-[8px]">★</span>
                    <span className="text-lg leading-none">{student.points}</span>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="w-full grid grid-cols-2 gap-1 mt-auto">
                  <div className="bg-[#ebfaf2] border border-[#c3f2d7] rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                    <div className="text-[#2ecc71] font-bold text-[8px] leading-tight">POS / 加分</div>
                    <div className="text-[#2ecc71] font-black text-sm leading-tight">+{student.plusPoints}</div>
                  </div>
                  <div className="bg-[#fff5f5] border border-[#ffcccc] rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                    <div className="text-[#e74c3c] font-bold text-[8px] leading-tight">NEG / 減分</div>
                    <div className="text-[#e74c3c] font-black text-sm leading-tight">-{student.minusPoints}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pokemon Picker Modal */}
      {showPokemonPicker !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col p-6 shadow-2xl border-8 border-yellow-400">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-600">Choose Pokemon / 選擇寶可夢</h2>
              <button onClick={() => setShowPokemonPicker(null)} className="text-3xl font-bold text-gray-400 hover:text-red-500">&times;</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto p-2 scroll-hide">
              {Array.from({ length: POKEMON_COUNT }).map((_, i) => {
                const id = i + 1;
                const name = POKEMON_NAMES[id];
                return (
                  <button 
                    key={id}
                    onClick={() => {
                      updateStudent(showPokemonPicker!, { pokemonId: id });
                      setShowPokemonPicker(null);
                    }}
                    className="flex flex-col items-center bg-gray-50 rounded-xl p-2 hover:bg-yellow-100 transition border-2 border-transparent hover:border-yellow-300"
                  >
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                      alt="poke"
                      className="w-14 h-14"
                    />
                    <span className="text-[10px] font-bold text-gray-400">#{id}</span>
                    <span className="text-[10px] text-gray-600 font-bold truncate w-full text-center">{name?.zh || `Poke #${id}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Score Apply Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[98vh] overflow-y-auto shadow-2xl relative border-[8px] border-pink-200">
            
            {/* Header Section */}
            <div className="bg-[#ff92a9] p-4 text-white relative rounded-t-[2.5rem] flex items-center gap-5">
              {currentlySelectedStudents.length === 1 ? (
                <>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1.5 border-4 border-pink-200 shadow-lg">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentlySelectedStudents[0].pokemonId}.png`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black">#{currentlySelectedStudents[0].id} {currentlySelectedStudents[0].name}</h2>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-0.5 inline-flex items-center gap-1.5 mt-1 border border-white/30">
                       <span className="text-xs font-bold">⭐ 當前積分:</span>
                       <span className="text-xl font-black">{currentlySelectedStudents[0].points}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-black">已選定 {currentlySelectedStudents.length} 位學生</h2>
                  <p className="opacity-80 font-bold text-sm">MULTIPLE STUDENTS SELECTED</p>
                </div>
              )}
              <button 
                onClick={() => setShowScoreModal(false)} 
                className="absolute top-4 right-6 text-3xl font-black text-white hover:scale-110 transition-transform"
              >&times;</button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Manual Input Container */}
                <div className="bg-[#f8f9fa] border-2 border-dashed border-gray-200 rounded-3xl p-4 shadow-inner">
                  <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">MANUAL INPUT / 手動輸入</h4>
                  <div className="flex items-center gap-2 justify-center">
                    <input 
                      type="number"
                      placeholder="Points..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualInput) {
                          applyPoints(currentlySelectedStudents, parseInt(manualInput), '手動輸入');
                        }
                      }}
                      className="w-48 px-4 py-2 bg-white rounded-xl border border-gray-300 focus:border-blue-400 outline-none font-bold text-lg text-gray-700 text-center shadow-sm"
                    />
                    <button 
                      onClick={() => {
                        if (manualInput) {
                          applyPoints(currentlySelectedStudents, parseInt(manualInput), '手動輸入');
                        }
                      }}
                      className="px-6 py-2 bg-[#3498db] text-white rounded-xl font-bold text-base hover:bg-blue-600 shadow-md transition-all active:scale-95 whitespace-nowrap"
                    >
                      Apply / 應用
                    </button>
                  </div>
                </div>

                {/* Action Lists */}
                <div className="flex flex-col md:flex-row gap-8 justify-center">
                  {/* Positive Column */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4 px-2 border-b-2 border-green-50 pb-2">
                      <span className="text-xl">⭐</span>
                      <h3 className="text-lg font-black text-green-500 uppercase tracking-widest">POSITIVE / 加分行為</h3>
                    </div>
                    <div className="space-y-2">
                      {POSITIVE_ACTIONS.map(action => (
                        <button
                          key={action.label}
                          onClick={() => applyPoints(currentlySelectedStudents, action.value, action.label)}
                          className="w-full px-4 py-2 bg-[#ebfaf2] hover:bg-[#d8f5e6] rounded-xl text-left border border-[#c3f2d7] flex items-center gap-3 transition-all group active:scale-[0.98] shadow-sm"
                        >
                          <span className="text-xl group-hover:scale-125 transition inline-block w-6 text-center">{action.icon}</span>
                          <div className="flex-1 flex items-baseline gap-2 overflow-hidden">
                            <div className="font-bold text-green-700 text-sm md:text-base leading-tight shrink-0">{action.label}</div>
                            <div className="text-[10px] text-green-400 italic opacity-80 uppercase font-medium truncate">{action.labelEn}</div>
                          </div>
                          <div className="text-xl font-black text-[#2ecc71] ml-auto">+{action.value}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negative Column */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4 px-2 border-b-2 border-red-50 pb-2">
                      <span className="text-xl">⚠️</span>
                      <h3 className="text-lg font-black text-red-500 uppercase tracking-widest">NEGATIVE / 減分行為</h3>
                    </div>
                    <div className="space-y-2">
                      {NEGATIVE_ACTIONS.map(action => (
                        <button
                          key={action.label}
                          onClick={() => applyPoints(currentlySelectedStudents, action.value, action.label)}
                          className="w-full px-4 py-2 bg-[#fff5f5] hover:bg-[#ffe3e3] rounded-xl text-left border border-[#ffcccc] flex items-center gap-3 transition-all group active:scale-[0.98] shadow-sm"
                        >
                          <span className="text-xl group-hover:scale-125 transition inline-block w-6 text-center">{action.icon}</span>
                          <div className="flex-1 flex items-baseline gap-2 overflow-hidden">
                            <div className="font-bold text-red-700 text-sm md:text-base leading-tight shrink-0">{action.label}</div>
                            <div className="text-[10px] text-red-400 italic opacity-80 uppercase font-medium truncate">{action.labelEn}</div>
                          </div>
                          <div className="text-xl font-black text-[#e74c3c] ml-auto">{action.value}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="text-center py-4 text-gray-300 font-black tracking-widest text-[10px] uppercase">
              MISS IONG'S CLASS SYSTEM
            </div>
          </div>
        </div>
      )}

      {/* Result Overlay */}
      {scoreResult && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-300 ${scoreResult.isPositive ? 'bg-white/30' : 'bg-pink-100/50'}`}>
          {scoreResult.isPositive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="firework" style={{ 
                  left: `${5 + Math.random() * 90}%`, 
                  top: `${10 + Math.random() * 80}%`, 
                  animationDelay: `${i * 0.2}s`
                }}></div>
              ))}
            </div>
          )}

          <div className={`rounded-[3rem] p-10 shadow-2xl border-[12px] text-center max-w-md w-full m-4 relative z-10 transition-colors duration-500
            ${scoreResult.isPositive 
              ? 'bg-white border-pink-400' 
              : 'bg-pink-100 border-pink-300'}`}>
            
            <h2 className="text-4xl font-black mb-2 animate-bounce uppercase">
              {scoreResult.isPositive ? 'CONGRATULATIONS!' : 'KEEP WORKING HARD!'}
            </h2>
            <h3 className={`text-2xl font-bold mb-6 ${scoreResult.isPositive ? 'text-pink-500' : 'text-pink-600'}`}>
              {scoreResult.isPositive ? '恭喜你！' : '繼續努力！'}
            </h3>
            
            <div className={`space-y-4 py-4 border-y-4 border-dotted my-4 ${scoreResult.isPositive ? 'border-pink-100' : 'border-pink-200'}`}>
              {scoreResult.students.length === 1 ? (
                <>
                  <p className="text-3xl font-black text-slate-800">#{scoreResult.students[0].id} {scoreResult.students[0].name}</p>
                  <div className={`mx-auto w-40 h-40 rounded-full flex items-center justify-center p-4 shadow-inner ${scoreResult.isPositive ? 'bg-pink-50' : 'bg-pink-50/50'}`}>
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${scoreResult.students[0].pokemonId}.png`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className={`text-4xl font-black ${scoreResult.isPositive ? 'text-pink-600' : 'text-pink-500'}`}>
                    {scoreResult.points > 0 ? '+' : ''}{scoreResult.points} {scoreResult.reason}
                  </p>
                  <div className="bg-yellow-50 text-amber-700 rounded-full px-6 py-2 inline-flex items-center gap-2 font-black shadow-md mt-2">
                    <span className="text-lg">⭐ 最新總分:</span>
                    <span className="text-3xl">{scoreResult.students[0].newTotal}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-700">多選評分 ({scoreResult.students.length} 位學生)</p>
                  <p className={`text-4xl font-black ${scoreResult.isPositive ? 'text-pink-600' : 'text-pink-500'}`}>
                    {scoreResult.points > 0 ? '+' : ''}{scoreResult.points} {scoreResult.reason}
                  </p>
                  <p className="text-xl font-bold text-pink-400 mt-4 italic uppercase tracking-wider">Scores updated!</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Random Picker Overlay */}
      {showRandomPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-[12px] border-red-400 text-center max-w-lg w-full m-4">
            <h2 className="text-3xl font-black text-red-500 mb-6 uppercase">🔍 Searching / 抽取中... ({pickedHistory.length}/{currentClass.students.length})</h2>
            <div className="h-72 flex items-center justify-center bg-red-50 rounded-[2rem] mb-6 relative overflow-hidden border-4 border-red-100">
              {flashingStudent && !randomPickResult && (
                <div className="animate-pulse">
                  <div className="mx-auto w-40 h-40">
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${flashingStudent.pokemonId}.png`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-4xl font-black text-red-600 mt-4">#{flashingStudent.id} {flashingStudent.name}</p>
                </div>
              )}
              {randomPickResult && (
                <div className="scale-110 animate-in zoom-in duration-300">
                  <div className="mx-auto w-48 h-48">
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomPickResult.pokemonId}.png`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-6xl font-black text-pink-600 mt-4">#{randomPickResult.id} {randomPickResult.name}</p>
                  <p className="text-xl font-bold text-pink-400 mt-2 uppercase tracking-widest">I CHOOSE YOU! / 就決定是你了！</p>
                </div>
              )}
            </div>
            {randomPickResult && (
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setSelectedStudents([randomPickResult.id]);
                    setShowRandomPicker(false);
                    setShowScoreModal(true);
                  }}
                  className="flex-1 py-5 bg-pink-500 text-white rounded-[1.5rem] font-black text-2xl hover:bg-pink-600 shadow-lg active:scale-95 transition"
                >
                  評分
                </button>
                <button 
                  onClick={() => setShowRandomPicker(false)}
                  className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-2xl hover:bg-slate-200 transition"
                >
                  CLOSE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border-8 border-yellow-300">
            <h2 className="text-3xl font-black text-yellow-600 mb-8 flex flex-col items-center gap-2 text-center">
              <span className="text-5xl">🔔</span>
              默書/測驗/考試 加分細則 <br/> <span className="text-sm font-bold opacity-50 uppercase tracking-widest">Rules for Tests & Exams</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl font-black text-xl border-b-4 border-yellow-100">
                <span className="text-slate-700">100 或以上</span><span className="text-green-500">+25</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl font-black text-xl border-b-4 border-yellow-100">
                <span className="text-slate-700">90 ～ 99</span><span className="text-green-500">+20</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl font-black text-xl border-b-4 border-yellow-100">
                <span className="text-slate-700">80 ～ 89</span><span className="text-green-500">+15</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl font-black text-xl border-b-4 border-yellow-100">
                <span className="text-slate-700">70 ～ 79</span><span className="text-green-500">+10</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl font-black text-xl border-b-4 border-yellow-100">
                <span className="text-slate-700">60 ～ 69</span><span className="text-green-500">+5</span>
              </div>
            </div>
            <button 
              onClick={() => setShowRules(false)}
              className="w-full mt-10 py-5 bg-yellow-400 text-white rounded-[1.5rem] font-black text-2xl hover:bg-yellow-500 transition shadow-lg active:scale-95"
            >
              GOT IT! / 知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
