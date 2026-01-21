
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

  const applyPoints = (targets: Student[], amount: number, reason: string) => {
    const isPositive = amount > 0;
    
    // Prepare result data for the overlay (showing updated totals)
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

    // Auto-close result after delay
    setTimeout(() => setScoreResult(null), 1500);
    
    // Reset selection state
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
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border-4 border-pink-200">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold text-pink-600 drop-shadow-sm">Miss Iong's Class</h1>
          <p className="text-pink-400 font-semibold mt-1">⭐ Point Management System / 學生積分系統 ⭐</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0 items-center justify-center">
          {/* Class Selector Dropdown */}
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
        {/* Control Bar (Sorting and Command Buttons) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 p-4 rounded-2xl border-2 border-pink-100 shadow-sm">
          {/* Sorting Group */}
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
          
          {/* Action Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selection Controls */}
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

            {/* Random Controls */}
            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-full border border-red-100">
              <button 
                onClick={handleRandomPick}
                className="px-3 py-1 bg-red-400 text-white text-xs font-bold rounded-full hover:bg-red-500 transition shadow-sm"
              >
                隨機
              </button>
              <button 
                onClick={() => setPickedHistory([])}
                title="Reset Picked History"
                className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-300 transition shadow-sm"
              >
                🔄
              </button>
            </div>

            {/* Award Points Button */}
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

            {/* Rules Button */}
            <button 
              onClick={() => setShowRules(true)}
              className="w-9 h-9 flex items-center justify-center bg-yellow-400 text-white rounded-full text-lg shadow-md hover:scale-110 transition"
            >
              🔔
            </button>
          </div>
        </div>

        {/* Student Grid Container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedStudents.map((student, idx) => (
            <div 
              key={student.id}
              onClick={() => {
                // Instant Award Points for individual click
                setSelectedStudents([student.id]);
                setShowScoreModal(true);
              }}
              className={`relative bg-white rounded-2xl p-3 border-4 transition-all cursor-pointer group hover:scale-105 ${
                selectedStudents.includes(student.id) ? 'border-pink-400 shadow-pink-200 shadow-lg bg-pink-50' : 'border-white shadow-md'
              }`}
            >
              {sortType !== SortType.ID && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white z-10">
                  {idx + 1}
                </div>
              )}
              <div className="text-center">
                <span className="text-xs font-bold text-gray-400 block">#{student.id}</span>
                <div className="relative mx-auto w-16 h-16">
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
                <h3 className="font-bold text-gray-700 truncate mt-1">{student.name}</h3>
                <div className="flex justify-center gap-1 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-green-500 font-bold">+{student.plusPoints}</span>
                    <span className="text-[10px] text-red-500 font-bold">-{student.minusPoints}</span>
                  </div>
                  <div className="flex items-center ml-1">
                    <span className="text-lg font-black text-pink-500">{student.points}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl border-8 border-pink-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-pink-600">AWARD POINTS / 獎懲評分</h2>
              <button onClick={() => setShowScoreModal(false)} className="text-3xl font-bold text-gray-400 hover:text-red-500">&times;</button>
            </div>

            {/* Selected Students List Display */}
            <div className="mb-6 p-4 bg-pink-50 rounded-2xl border-2 border-dashed border-pink-200">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest mb-2">Selected Students / 已選擇學生 ({currentlySelectedStudents.length}):</h3>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scroll-hide">
                {currentlySelectedStudents.map(s => (
                  <div key={s.id} className="px-3 py-1 bg-white border-2 border-pink-100 rounded-full flex items-center gap-2 shadow-sm">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.pokemonId}.png`} 
                      className="w-5 h-5 object-contain"
                    />
                    <span className="text-sm font-bold text-gray-700">#{s.id} {s.name} (現時: {s.points})</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Manual Input / 手動輸入:</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="Points / 分數"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualInput) {
                      const amount = parseInt(manualInput);
                      applyPoints(currentlySelectedStudents, amount, 'Manual Entry / 手動輸入');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-pink-400 outline-none font-bold text-xl"
                />
                <button 
                  onClick={() => {
                    if (manualInput) {
                      const amount = parseInt(manualInput);
                      applyPoints(currentlySelectedStudents, amount, 'Manual Entry / 手動輸入');
                    }
                  }}
                  className="px-8 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 shadow-md transition-all active:scale-95"
                >
                  Apply / 應用
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-green-500 mb-4 flex items-center gap-2">
                  ⭐ POSITIVE / 加分
                </h3>
                <div className="space-y-2">
                  {POSITIVE_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      onClick={() => applyPoints(currentlySelectedStudents, action.value, action.label)}
                      className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-2xl text-left border-2 border-green-100 flex items-center gap-3 transition group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition">{action.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-green-700">{action.label}</div>
                        <div className="text-xs text-green-400 uppercase">{action.labelEn}</div>
                      </div>
                      <div className="text-xl font-black text-green-500">+{action.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                  ⚠️ NEGATIVE / 減分
                </h3>
                <div className="space-y-2">
                  {NEGATIVE_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      onClick={() => applyPoints(currentlySelectedStudents, action.value, action.label)}
                      className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-2xl text-left border-2 border-red-100 flex items-center gap-3 transition group"
                    >
                      <span className="text-2xl group-hover:scale-125 transition">{action.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-red-700">{action.label}</div>
                        <div className="text-xs text-red-400 uppercase">{action.labelEn}</div>
                      </div>
                      <div className="text-xl font-black text-red-500">{action.value}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Overlay */}
      {scoreResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-10 shadow-2xl border-[12px] border-pink-400 text-center max-w-md w-full m-4">
            <h2 className="text-4xl font-black mb-2 animate-bounce">
              {scoreResult.isPositive ? 'CONGRATULATIONS!' : 'KEEP WORKING HARD!'}
            </h2>
            <h3 className="text-2xl font-bold text-pink-500 mb-6">
              {scoreResult.isPositive ? '恭喜你！' : '繼續努力！'}
            </h3>
            
            <div className="space-y-4 py-4 border-y-4 border-dotted border-pink-100 my-4">
              {scoreResult.students.length === 1 ? (
                <>
                  <p className="text-2xl font-bold text-gray-700">#{scoreResult.students[0].id} {scoreResult.students[0].name}</p>
                  <div className="mx-auto w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center p-4">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${scoreResult.students[0].pokemonId}.png`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-3xl font-black text-pink-600">
                    {scoreResult.points > 0 ? '+' : ''}{scoreResult.points} {scoreResult.reason}
                  </p>
                  <p className="text-lg font-bold text-gray-400">Current Score / 當前分數: <span className="text-pink-500 text-2xl">{scoreResult.students[0].newTotal}</span></p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-gray-700">Multi-Select / 多選 ({scoreResult.students.length} Students)</p>
                  <p className="text-3xl font-black text-pink-600">
                    {scoreResult.points > 0 ? '+' : ''}{scoreResult.points} {scoreResult.reason}
                  </p>
                  <p className="text-lg font-bold text-gray-400 italic">Scores updated / 分數已更新</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Random Picker Overlay */}
      {showRandomPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-10 shadow-2xl border-[12px] border-red-400 text-center max-w-lg w-full m-4">
            <h2 className="text-3xl font-black text-red-500 mb-6 uppercase">🔍 Searching / 抽取中... ({pickedHistory.length}/{currentClass.students.length})</h2>
            <div className="h-64 flex items-center justify-center bg-red-50 rounded-2xl mb-6 relative overflow-hidden">
              {flashingStudent && !randomPickResult && (
                <div className="animate-pulse">
                  <div className="mx-auto w-32 h-32">
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${flashingStudent.pokemonId}.png`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-3xl font-black text-red-600 mt-4">#{flashingStudent.id} {flashingStudent.name}</p>
                </div>
              )}
              {randomPickResult && (
                <div className="scale-110 animate-in zoom-in duration-300">
                  <div className="mx-auto w-40 h-40">
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomPickResult.pokemonId}.png`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-5xl font-black text-pink-600 mt-4">#{randomPickResult.id} {randomPickResult.name}</p>
                  <p className="text-lg font-bold text-pink-400 mt-2">I CHOOSE YOU! / 就決定是你了！</p>
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
                  className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-black text-xl hover:bg-pink-600 shadow-lg active:scale-95 transition"
                >
                  AWARD POINTS / 評分
                </button>
                <button 
                  onClick={() => setShowRandomPicker(false)}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl font-black text-xl hover:bg-gray-300 transition"
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
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border-8 border-yellow-300">
            <h2 className="text-2xl font-black text-yellow-600 mb-6 flex items-center gap-2">
              🔔 默書/測驗/考試 加分細則 <br/> Rules for Tests & Exams
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl font-bold">
                <span>100 或以上</span><span className="text-green-500">+25</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl font-bold">
                <span>90 ～ 99</span><span className="text-green-500">+20</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl font-bold">
                <span>80 ～ 89</span><span className="text-green-500">+15</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl font-bold">
                <span>70 ～ 79</span><span className="text-green-500">+10</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl font-bold">
                <span>60 ～ 69</span><span className="text-green-500">+5</span>
              </div>
            </div>
            <button 
              onClick={() => setShowRules(false)}
              className="w-full mt-8 py-4 bg-yellow-400 text-white rounded-2xl font-bold hover:bg-yellow-500 transition shadow-lg"
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
