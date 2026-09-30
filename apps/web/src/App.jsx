import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Search, 
  Play, 
  Pause,
  Trash2, 
  Download, 
  Send, 
  ExternalLink, 
  ShieldAlert, 
  RefreshCw,
  Sliders,
  Volume2,
  Zap,
  Radio,
  Scissors,
  Share2,
  Copy,
  Check,
  Palette,
  Globe,
  Plus,
  ArrowRight,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dissector'); // dissector, tasks, candidates, onetake, long2shorts, multiuse, settings
  const [agentStatus, setAgentStatus] = useState({ online: false, draft_dir: '' });
  const [apiOnline, setApiOnline] = useState(false);

  // Workspaces
  const [workspaces, setWorkspaces] = useState([
    { id: 'ws-default', name: '기본 작업대 (바이럴 쇼츠)', min_views: 4000000, max_duration: 40 }
  ]);
  const [currentWs, setCurrentWs] = useState('ws-default');
  const [newWsName, setNewWsName] = useState('');
  const [showWsModal, setShowWsModal] = useState(false);

  // Channel Dissector State (Enhanced)
  const [channelUrls, setChannelUrls] = useState([
    'https://www.youtube.com/@MRBEAST',
    'https://www.youtube.com/@ZachChoi'
  ]);
  const [channelProfiles, setChannelProfiles] = useState({});
  const [isAnalyzingChannel, setIsAnalyzingChannel] = useState(false);

  const [subKeyword, setSubKeyword] = useState('강아지 레전드');
  const [expandedTags, setExpandedTags] = useState([]);
  const [selectedTagNames, setSelectedTagNames] = useState([]);
  const [isExpandingTags, setIsExpandingTags] = useState(false);

  const [minViews, setMinViews] = useState(4000000);
  const [maxDuration, setMaxDuration] = useState(40);
  const [sortBy, setSortBy] = useState('views');
  const [enableKeywordSearch, setEnableKeywordSearch] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);

  // Candidates State
  const [candidateFilter, setCandidateFilter] = useState('ALL');
  const [candidateData, setCandidateData] = useState({
    counts: { total: 0, unused: 0, used: 0, excluded: 0 },
    items: []
  });
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Tasks State
  const [tasks, setTasks] = useState([]);

  // One-Take State
  const [selectedVoice, setSelectedVoice] = useState('ko-KR-SunHiNeural');
  const [selectedStyle, setSelectedStyle] = useState('NO_BACK_STYLE');
  const [topHeaderText, setTopHeaderText] = useState('끝까지 보면 소름 돋는 순간 🔥');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [onetakeResult, setOnetakeResult] = useState(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [customComments, setCustomComments] = useState([
    "진짜 끝까지 보길 잘했다 ㅋㅋㅋ",
    "표정 변하는 거 보고 배꼽 잡고 구름",
    "이게 왜 1000만 뷰인지 바로 납득함"
  ]);

  // Long-to-Shorts State
  const [longVideoUrl, setLongVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isExtractingLong, setIsExtractingLong] = useState(false);
  const [longToShortsResult, setLongToShortsResult] = useState(null);

  // Multiuse State
  const [multiuseData, setMultiuseData] = useState(null);
  const [isGeneratingMultiuse, setIsGeneratingMultiuse] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [injectingStatus, setInjectingStatus] = useState('');

  // 1. Initial Health & Status Polling
  useEffect(() => {
    checkConnections();
    loadWorkspaces();
    loadCandidates();
    loadTasks();
    const interval = setInterval(checkConnections, 4000);
    return () => clearInterval(interval);
  }, []);

  const checkConnections = async () => {
    const apiRes = await api.checkHealth();
    setApiOnline(!!apiRes);

    const agRes = await api.checkAgentHealth();
    if (agRes && agRes.status === 'online') {
      setAgentStatus({ online: true, draft_dir: agRes.draft_dir });
    } else {
      setAgentStatus({ online: false, draft_dir: '' });
    }
  };

  const loadWorkspaces = async () => {
    try {
      const list = await api.getWorkspaces();
      if (list && list.length > 0) setWorkspaces(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return;
    try {
      const created = await api.createWorkspace(newWsName.trim(), minViews, maxDuration);
      setWorkspaces([...workspaces, created]);
      setCurrentWs(created.id);
      setNewWsName('');
      setShowWsModal(false);
    } catch (e) {
      alert("작업대 생성 실패");
    }
  };

  // 2. Fetch candidates & tasks
  useEffect(() => {
    loadCandidates();
    loadTasks();
  }, [candidateFilter]);

  const loadCandidates = async () => {
    try {
      const data = await api.getCandidates(candidateFilter);
      if (data && data.counts) {
        setCandidateData(data);
        if (!selectedVideo && data.items.length > 0) {
          setSelectedVideo(data.items[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTasks = async () => {
    try {
      const taskList = await api.getTasks();
      if (taskList) setTasks(taskList);
    } catch (e) {
      console.error(e);
    }
  };

  // Channel Dissector Actions
  const handleAnalyzeChannels = async () => {
    setIsAnalyzingChannel(true);
    const profiles = { ...channelProfiles };
    for (const url of channelUrls) {
      if (url.trim()) {
        try {
          const res = await api.analyzeChannel(url.trim());
          profiles[url.trim()] = res;
        } catch {}
      }
    }
    setChannelProfiles(profiles);
    setIsAnalyzingChannel(false);
  };

  const handleExpandKeywords = async () => {
    if (!subKeyword.trim()) return;
    setIsExpandingTags(true);
    try {
      const res = await api.expandTags(subKeyword.trim());
      if (res && res.tags) {
        setExpandedTags(res.tags);
        setSelectedTagNames(res.tags.map(t => t.tag));
      }
    } catch (e) {
      alert("키워드 확장 중 오류 발생");
    } finally {
      setIsExpandingTags(false);
    }
  };

  const toggleTagSelection = (tagName) => {
    if (selectedTagNames.includes(tagName)) {
      setSelectedTagNames(selectedTagNames.filter(t => t !== tagName));
    } else {
      setSelectedTagNames([...selectedTagNames, tagName]);
    }
  };

  const handleStartHarvest = async () => {
    setIsCollecting(true);
    try {
      const validUrls = channelUrls.filter(u => u.trim().length > 0);
      await api.collectShorts({
        workspace_id: currentWs,
        channel_urls: validUrls,
        keyword: subKeyword,
        min_views: minViews,
        max_duration: maxDuration,
        sort_by: sortBy,
        enable_keyword_cross_search: enableKeywordSearch,
        selected_tags: selectedTagNames
      });
      setActiveTab('tasks');
      loadTasks();
    } catch (err) {
      alert("수집 요청 중 오류가 발생했습니다.");
    } finally {
      setIsCollecting(false);
    }
  };

  const handleStatusChange = async (videoId, newStatus) => {
    await api.updateCandidateStatus(videoId, newStatus);
    loadCandidates();
  };

  const handleDeleteCandidate = async (videoId) => {
    if (confirm("이 영상을 총알 보관소에서 영구 삭제하시겠습니까?")) {
      await api.deleteCandidate(videoId);
      loadCandidates();
    }
  };

  const handleBlacklist = async (channelId, channelTitle) => {
    if (confirm(`'${channelTitle}' 채널의 모든 영상을 제외하고 블랙리스트에 등록하시겠습니까?`)) {
      await api.blacklistChannel(channelId);
      loadCandidates();
    }
  };

  const handleSelectForOneTake = async (video) => {
    setSelectedVideo(video);
    setActiveTab('onetake');
    const existing = await api.getOneTakeResult(video.youtube_video_id);
    if (existing) {
      setOnetakeResult(existing);
    } else {
      setOnetakeResult(null);
    }
  };

  const handleRunOneTake = async () => {
    if (!selectedVideo) return;
    setIsGeneratingScript(true);
    try {
      const res = await api.generateOneTake({
        video_id: selectedVideo.youtube_video_id,
        custom_comments: customComments,
        voice_id: selectedVoice,
        template_style: selectedStyle,
        top_header_text: selectedStyle === 'INSTA_LETTERBOX' ? topHeaderText : null
      });
      setOnetakeResult(res);
      handleStatusChange(selectedVideo.youtube_video_id, 'IN_PROGRESS');
    } catch (err) {
      alert("대본/TTS 생성 실패: " + err.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Long-to-Shorts Action
  const handleRunLongToShorts = async () => {
    if (!longVideoUrl) return;
    setIsExtractingLong(true);
    try {
      const res = await api.extractLongToShorts(longVideoUrl, 45, 3);
      setLongToShortsResult(res);
    } catch (err) {
      alert("롱투숏 분석 실패: " + err.message);
    } finally {
      setIsExtractingLong(false);
    }
  };

  // Multiuse Action
  const handleLoadMultiuse = async () => {
    if (!selectedVideo) return;
    setIsGeneratingMultiuse(true);
    try {
      const res = await api.generateMultiuse(selectedVideo.youtube_video_id, onetakeResult?.selected_title);
      setMultiuseData(res);
    } catch (err) {
      alert("멀티유즈 메타데이터 생성 실패: " + err.message);
    } finally {
      setIsGeneratingMultiuse(false);
    }
  };

  const handleCopyClipboard = (text, keyName) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Inject to CapCut
  const handleInjectToCapCut = async () => {
    if (!selectedVideo) return;
    setInjectingStatus('로컬 캡컷으로 주입 중...');
    try {
      const bundle = await api.getCapCutBundle(selectedVideo.youtube_video_id);
      await api.injectDraftToCapCut({
        project_name: bundle.project_name,
        draft_content: bundle.draft_content,
        draft_meta_info: bundle.draft_meta_info,
        audio_files: bundle.audio_files,
        auto_open: true
      });
      setInjectingStatus('주입 완료! 캡컷 프로젝트가 열렸습니다.');
      handleStatusChange(selectedVideo.youtube_video_id, 'USED');
      setTimeout(() => {
        setShowExportModal(false);
        setInjectingStatus('');
      }, 2000);
    } catch (err) {
      setInjectingStatus('에러: 로컬 에이전트(Port 28765)가 실행 중인지 확인하세요.');
    }
  };

  const togglePlayAudio = (url) => {
    if (playingAudioUrl === url) {
      setPlayingAudioUrl(null);
    } else {
      setPlayingAudioUrl(url);
      const audio = new Audio(url);
      audio.play().catch(e => console.log("Audio play error", e));
      audio.onended = () => setPlayingAudioUrl(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#080a0d] text-slate-100 antialiased overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f1217] border-r border-[#1f242d] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-[#1f242d]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFE600] to-amber-500 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/20">
              S
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                SHORTS <span className="text-[#FFE600] text-[10px] bg-[#FFE600]/10 px-1.5 py-0.5 rounded font-mono">HARVESTER</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">숏츠 하베스터 · 캡컷 자동화</div>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-[#1f242d] bg-[#0c0e12]/60">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
              <span>현재 작업대 (Workspace)</span>
              <button 
                onClick={() => setShowWsModal(true)}
                className="text-[#FFE600] hover:underline flex items-center gap-0.5 text-[10px]"
              >
                <Plus className="w-3 h-3" /> 새 작업대
              </button>
            </div>
            <select
              value={currentWs}
              onChange={(e) => setCurrentWs(e.target.value)}
              className="w-full bg-[#161a22] border border-[#232731] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-[#FFE600]"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('dissector')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dissector' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <Flame className={`w-4 h-4 ${activeTab === 'dissector' ? 'text-[#FFE600]' : ''}`} />
              채널 해체 (발굴)
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'tasks' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={`w-4 h-4 ${activeTab === 'tasks' ? 'text-[#FFE600]' : ''}`} />
                작업 현황
              </div>
              {tasks.some(t => t.status === 'RUNNING') && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 badge-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('candidates')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'candidates' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className={`w-4 h-4 ${activeTab === 'candidates' ? 'text-[#FFE600]' : ''}`} />
                후보 검수 (총알)
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#202734] text-slate-300 font-mono">
                {candidateData.counts.unused}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('onetake')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'onetake' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <Zap className={`w-4 h-4 ${activeTab === 'onetake' ? 'text-[#FFE600]' : ''}`} />
              원테이크 자동화
            </button>

            <button
              onClick={() => setActiveTab('long2shorts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'long2shorts' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <Scissors className={`w-4 h-4 ${activeTab === 'long2shorts' ? 'text-[#FFE600]' : ''}`} />
              롱투숏 엔진 (9:16)
            </button>

            <button
              onClick={() => { setActiveTab('multiuse'); handleLoadMultiuse(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'multiuse' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <Share2 className={`w-4 h-4 ${activeTab === 'multiuse' ? 'text-[#FFE600]' : ''}`} />
              멀티유즈 SNS 패키저
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-[#181d25] text-[#FFE600] border border-[#FFE600]/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14181f]'
              }`}
            >
              <Cpu className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#FFE600]' : ''}`} />
              로컬 캡컷 연동 설정
            </button>
          </nav>
        </div>

        {/* System Status Footbar */}
        <div className="p-4 border-t border-[#1f242d] bg-[#0c0e12] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">백엔드 API</span>
            <span className={`flex items-center gap-1.5 font-medium ${apiOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {apiOnline ? '온라인' : '오프라인'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">CapCut 로컬 에이전트</span>
            <span className={`flex items-center gap-1.5 font-medium ${agentStatus.online ? 'text-[#FFE600]' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${agentStatus.online ? 'bg-[#FFE600] badge-pulse' : 'bg-slate-500'}`} />
              {agentStatus.online ? '연결됨 (Port 28765)' : '미연결'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0f1217]/80 backdrop-blur border-b border-[#1f242d] px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              {activeTab === 'dissector' && '🪓 채널 해체 (Channel Dissector) · 글로벌 쇼츠 총알 발굴기'}
              {activeTab === 'tasks' && '📊 실시간 수집 및 생성 작업 현황'}
              {activeTab === 'candidates' && '🎯 후보 검수 (총알 창고)'}
              {activeTab === 'onetake' && '⚡ 원테이크 AI 대본 & TTS 제작'}
              {activeTab === 'long2shorts' && '✂️ 롱투숏 (Long-to-Shorts) 하이라이트 분할'}
              {activeTab === 'multiuse' && '🌐 멀티유즈 SNS 메타데이터 패키저'}
              {activeTab === 'settings' && '⚙️ 로컬 CapCut 에이전트 브릿지 진단'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { loadCandidates(); loadTasks(); checkConnections(); }}
              className="p-2 rounded-lg bg-[#181d25] hover:bg-[#202734] text-slate-300 transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {selectedVideo && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFE600] to-amber-400 text-black font-bold text-xs shadow-md shadow-amber-400/20 hover:brightness-105 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                CapCut으로 보내기
              </button>
            )}
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          {/* 1. 채널 해체 탭 (완전 보강 버전) */}
          {activeTab === 'dissector' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 Cols: Channel URLs & Keywords */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Channel Inputs */}
                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#232731] pb-3">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <Flame className="w-4 h-4 text-[#FFE600]" />
                          레퍼런스 채널 해체 (최대 5개)
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          채널 쇼츠 탭을 심층 분석하여 400만 뷰 이상 검증된 바이럴 레퍼런스를 추출합니다.
                        </p>
                      </div>
                      <button
                        onClick={handleAnalyzeChannels}
                        disabled={isAnalyzingChannel}
                        className="px-3 py-1.5 rounded-lg bg-[#202734] hover:bg-[#2e3748] text-xs font-semibold text-slate-200 transition-colors"
                      >
                        {isAnalyzingChannel ? "채널 프로필 분석 중..." : "채널 빠른 프로필 검증"}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {channelUrls.map((url, i) => {
                        const prof = channelProfiles[url.trim()];
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={url}
                                onChange={(e) => {
                                  const copy = [...channelUrls];
                                  copy[i] = e.target.value;
                                  setChannelUrls(copy);
                                }}
                                placeholder="https://www.youtube.com/@ChannelName"
                                className="flex-1 bg-[#13161c] border border-[#232731] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#FFE600] transition-colors"
                              />
                              {channelUrls.length > 1 && (
                                <button
                                  onClick={() => setChannelUrls(channelUrls.filter((_, idx) => idx !== i))}
                                  className="p-2.5 rounded-xl bg-[#1a1f29] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            {prof && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-[#161a22] rounded-lg text-xs text-slate-300">
                                <img src={prof.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                                <span className="font-bold text-[#FFE600]">{prof.channel_title}</span>
                                <span className="text-[11px] text-slate-500">({prof.channel_id})</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {channelUrls.length < 5 && (
                        <button
                          onClick={() => setChannelUrls([...channelUrls, ''])}
                          className="text-xs text-[#FFE600] font-semibold hover:underline"
                        >
                          + 채널 URL 추가 (최대 5개)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-lingual AI Expansion */}
                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#232731] pb-3">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#FFE600]" />
                          다국어 키워드 자동 확장 & 글로벌 교차 검색
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          국내 키워드를 AI가 영어, 일본어, 스페인어 바이럴 해시태그로 실시간 변환하여 해외 쇼츠까지 교차 발굴합니다.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={subKeyword}
                        onChange={(e) => setSubKeyword(e.target.value)}
                        placeholder="예: 강아지 레전드, 직장인 공감, 기절 반전"
                        className="flex-1 bg-[#13161c] border border-[#232731] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#FFE600]"
                      />
                      <button
                        onClick={handleExpandKeywords}
                        disabled={isExpandingTags}
                        className="px-5 py-2.5 rounded-xl bg-[#202734] hover:bg-[#FFE600] hover:text-black text-slate-200 font-bold text-xs transition-colors disabled:opacity-50"
                      >
                        {isExpandingTags ? "AI 태그 생성 중..." : "AI 글로벌 태그 확장"}
                      </button>
                    </div>

                    {/* Expanded Tag Badges */}
                    {expandedTags.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-semibold text-slate-300">
                          수집에 포함할 글로벌 태그 선택 ({selectedTagNames.length}/{expandedTags.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {expandedTags.map((tagObj, idx) => {
                            const isSelected = selectedTagNames.includes(tagObj.tag);
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleTagSelection(tagObj.tag)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected 
                                    ? 'bg-[#FFE600]/10 border-[#FFE600] text-[#FFE600]' 
                                    : 'bg-[#13161c] border-[#232731] text-slate-400'
                                }`}
                              >
                                <span className="text-[10px] px-1 py-0.2 bg-[#202734] rounded text-slate-300">{tagObj.lang}</span>
                                <span>{tagObj.tag}</span>
                                <span className="opacity-60">{tagObj.hashtag}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 4 Cols: Filter Controls & Launch Trigger */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#232731] pb-3">
                      <Filter className="w-4 h-4 text-[#FFE600]" />
                      수질 관리 및 수집 필터 조건
                    </h3>

                    {/* Minimum Views Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>최소 조회수 필터</span>
                        <span className="text-[#FFE600] font-mono font-bold">
                          {(minViews / 10000).toLocaleString()}만 뷰 이상
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1000000}
                        max={10000000}
                        step={500000}
                        value={minViews}
                        onChange={(e) => setMinViews(Number(e.target.value))}
                        className="w-full mt-2 accent-[#FFE600]"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>100만</span>
                        <span>400만 (표준)</span>
                        <span>1000만</span>
                      </div>
                    </div>

                    {/* Max Duration Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>영상 최대 길이 제한</span>
                        <span className="text-[#FFE600] font-mono font-bold">{maxDuration}초 이내</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={60}
                        step={5}
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(Number(e.target.value))}
                        className="w-full mt-2 accent-[#FFE600]"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>15초</span>
                        <span>40초 (알고리즘 최적)</span>
                        <span>60초</span>
                      </div>
                    </div>

                    {/* Sorting Option */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300">정렬 기준</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button
                          onClick={() => setSortBy('views')}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            sortBy === 'views' 
                              ? 'bg-[#FFE600]/10 border-[#FFE600] text-[#FFE600]' 
                              : 'bg-[#13161c] border-[#232731] text-slate-400'
                          }`}
                        >
                          🔥 조회수 인기순
                        </button>
                        <button
                          onClick={() => setSortBy('recent')}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            sortBy === 'recent' 
                              ? 'bg-[#FFE600]/10 border-[#FFE600] text-[#FFE600]' 
                              : 'bg-[#13161c] border-[#232731] text-slate-400'
                          }`}
                        >
                          ⏱ 최신순
                        </button>
                      </div>
                    </div>

                    {/* Cross Search Checkbox */}
                    <div className="pt-2 border-t border-[#232731]">
                      <button
                        onClick={() => setEnableKeywordSearch(!enableKeywordSearch)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-300 text-left"
                      >
                        {enableKeywordSearch ? (
                          <CheckSquare className="w-4 h-4 text-[#FFE600] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span>다국어 키워드 글로벌 교차 검색 동시 수행</span>
                      </button>
                    </div>

                    {/* Big Action Button */}
                    <button
                      onClick={handleStartHarvest}
                      disabled={isCollecting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFE600] to-amber-400 text-black font-black text-sm shadow-xl shadow-amber-400/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Flame className="w-5 h-5 fill-black" />
                      {isCollecting ? "채널 해체 및 수집 중..." : "쇼츠 총알 발굴 시작 (채널 해체)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 작업 현황 탭 */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300">비동기 백그라운드 작업 모니터</h2>
                <button
                  onClick={loadTasks}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl text-slate-500 text-sm">
                  등록된 백그라운드 작업이 없습니다. [채널 해체] 탭에서 수집을 시작해 보세요.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="glass-panel p-5 rounded-2xl space-y-3 border border-[#232731]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                            task.status === 'COMPLETED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-[#FFE600]/10 text-[#FFE600] border border-[#FFE600]/20'
                          }`}>
                            {task.status}
                          </span>
                          <span className="text-sm font-semibold text-slate-200">{task.message}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{task.progress}%</span>
                      </div>

                      <div className="w-full bg-[#13161c] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-[#FFE600] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. 후보 검수 (총알 관리) 탭 */}
          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setCandidateFilter('ALL')}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    candidateFilter === 'ALL'
                      ? 'bg-[#161a22] border-[#FFE600]/30 shadow-md'
                      : 'bg-[#0f1217] border-[#1f242d] hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs text-slate-400 font-medium">전체 수집 총알</div>
                  <div className="text-2xl font-black text-white mt-1 font-mono">{candidateData.counts.total}</div>
                </button>

                <button
                  onClick={() => setCandidateFilter('UNUSED')}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    candidateFilter === 'UNUSED'
                      ? 'bg-[#161a22] border-[#FFE600]/30 shadow-md'
                      : 'bg-[#0f1217] border-[#1f242d] hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs text-[#FFE600] font-semibold">미사용 대기 총알</div>
                  <div className="text-2xl font-black text-[#FFE600] mt-1 font-mono">{candidateData.counts.unused}</div>
                </button>

                <button
                  onClick={() => setCandidateFilter('USED')}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    candidateFilter === 'USED'
                      ? 'bg-[#161a22] border-[#FFE600]/30 shadow-md'
                      : 'bg-[#0f1217] border-[#1f242d] hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs text-emerald-400 font-semibold">제작 완료 총알</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{candidateData.counts.used}</div>
                </button>

                <button
                  onClick={() => setCandidateFilter('EXCLUDED')}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    candidateFilter === 'EXCLUDED'
                      ? 'bg-[#161a22] border-[#FFE600]/30 shadow-md'
                      : 'bg-[#0f1217] border-[#1f242d] hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs text-rose-400 font-semibold">제외 / 휴지통</div>
                  <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{candidateData.counts.excluded}</div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {candidateData.items.map((video) => (
                  <div 
                    key={video.youtube_video_id}
                    className={`glass-panel rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                      selectedVideo?.youtube_video_id === video.youtube_video_id
                        ? 'border-[#FFE600] ring-1 ring-[#FFE600]/40 shadow-lg'
                        : 'border-[#1f242d] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-[9/10] bg-black/40 overflow-hidden group">
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-white">
                          ⏱ {video.duration}초
                        </div>
                        <div className="absolute top-3 right-3 bg-[#FFE600] text-black px-2.5 py-1 rounded-md text-[11px] font-black font-mono">
                          🔥 {(video.view_count / 10000).toFixed(0)}만 뷰
                        </div>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur transition-colors"
                          title="유튜브 원본 열기"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                          <span>{video.channel_title}</span>
                          {video.harvest_source && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#202734] text-[#FFE600] font-mono">
                              {video.harvest_source}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                          {video.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-[#1f242d] mt-2 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleSelectForOneTake(video)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-[#FFE600] hover:bg-amber-400 text-black font-extrabold text-xs transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        원테이크
                      </button>

                      <button
                        onClick={() => handleBlacklist(video.channel_id, video.channel_title)}
                        className="p-2 rounded-xl bg-[#1a1f29] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                        title="채널 제외 (블랙리스트)"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleStatusChange(
                          video.youtube_video_id, 
                          video.status === 'UNUSED' ? 'USED' : 'UNUSED'
                        )}
                        className="p-2 rounded-xl bg-[#1a1f29] hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="상태 토글"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${video.status === 'USED' ? 'text-emerald-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleDeleteCandidate(video.youtube_video_id)}
                        className="p-2 rounded-xl bg-[#1a1f29] hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 transition-colors"
                        title="영구 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. 원테이크 자동화 탭 */}
          {activeTab === 'onetake' && (
            <div className="space-y-6">
              {!selectedVideo ? (
                <div className="glass-panel p-12 text-center rounded-2xl text-slate-400">
                  후보 검수 탭에서 영상을 먼저 선택해 주세요.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="text-xs font-bold text-[#FFE600] tracking-wider uppercase">선택된 타깃 쇼츠</div>
                      <div className="aspect-video bg-black/60 rounded-xl overflow-hidden relative">
                        <img 
                          src={selectedVideo.thumbnail_url} 
                          alt={selectedVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <a 
                            href={selectedVideo.video_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-3 rounded-full bg-black/70 hover:bg-[#FFE600] text-white hover:text-black transition-colors"
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </a>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white">{selectedVideo.title}</h3>
                    </div>

                    {/* Style Preset & Letterbox Options */}
                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-[#FFE600]" />
                        노빠꾸 스타일 & 캡컷 템플릿
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'NO_BACK_STYLE', name: '노빠꾸 옐로우 (추천)', desc: '고대비 노란 폰트 + 블랙 스트로크' },
                          { id: 'INSTA_LETTERBOX', name: '인스타 상하단 바', desc: '상단 후킹 텍스트 바 + 하단 자막' },
                          { id: 'NEON_RED_STYLE', name: '네온 사이버 레드', desc: '충격/긴급 붉은 폰트 스타일' },
                          { id: 'CLEAN_WHITE', name: '클린 화이트', desc: '모던 화이트 폰트 스타일' }
                        ].map((st) => (
                          <button
                            key={st.id}
                            onClick={() => setSelectedStyle(st.id)}
                            className={`p-3 rounded-xl text-left border transition-all ${
                              selectedStyle === st.id
                                ? 'bg-[#FFE600]/10 border-[#FFE600] text-[#FFE600]'
                                : 'bg-[#13161c] border-[#232731] text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="text-xs font-bold">{st.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{st.desc}</div>
                          </button>
                        ))}
                      </div>

                      {selectedStyle === 'INSTA_LETTERBOX' && (
                        <div className="pt-2">
                          <label className="text-[11px] font-semibold text-slate-400">상단 레터박스 후킹 문구</label>
                          <input
                            type="text"
                            value={topHeaderText}
                            onChange={(e) => setTopHeaderText(e.target.value)}
                            className="w-full mt-1 bg-[#13161c] border border-[#232731] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FFE600]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Comments configuration */}
                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="text-xs font-bold text-slate-300">상위 공감 댓글 (3단계 잽 원천)</div>
                      <div className="space-y-2">
                        {customComments.map((comm, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={comm}
                            onChange={(e) => {
                              const copy = [...customComments];
                              copy[idx] = e.target.value;
                              setCustomComments(copy);
                            }}
                            className="w-full bg-[#13161c] border border-[#232731] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FFE600]"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Voice engine selection */}
                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-[#FFE600]" />
                        Edge-TTS 나레이션 보이스
                      </div>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full bg-[#13161c] border border-[#232731] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#FFE600]"
                      >
                        <option value="ko-KR-SunHiNeural">선희 (차분하고 또렷한 여성)</option>
                        <option value="ko-KR-InJoonNeural">인준 (신뢰감 있는 남성)</option>
                        <option value="ko-KR-HyunsuNeural">현수 (활기찬 젊은 남성)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRunOneTake}
                      disabled={isGeneratingScript}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFE600] to-amber-400 text-black font-black text-sm shadow-lg shadow-amber-400/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 fill-black" />
                      {isGeneratingScript ? "AI 잽 대본 & TTS 음성 생성 중..." : "원클릭 대본 + TTS 오디오 생성"}
                    </button>
                  </div>

                  {/* Right Column (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {!onetakeResult ? (
                      <div className="glass-panel h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center rounded-2xl space-y-3 text-slate-400">
                        <Zap className="w-10 h-10 text-[#FFE600] opacity-40" />
                        <div className="text-sm font-semibold">대본이 아직 생성되지 않았습니다.</div>
                        <div className="text-xs text-slate-500 max-w-sm">
                          왼쪽의 [원클릭 대본 + TTS 오디오 생성] 버튼을 누르면 Gemini 2.5 Flash가 3단계 잽 대본을 작성하고 Edge-TTS가 나레이션을 합성합니다.
                        </div>
                      </div>
                    ) : (
                      <div className="glass-panel p-6 rounded-2xl space-y-6">
                        {/* Title Candidates */}
                        <div>
                          <div className="text-xs font-bold text-[#FFE600] uppercase tracking-wider mb-2">
                            후킹 제목 3종 후보 (클릭하여 선택)
                          </div>
                          <div className="space-y-2">
                            {onetakeResult.title_candidates.map((tit, i) => (
                              <button
                                key={i}
                                onClick={() => setOnetakeResult({ ...onetakeResult, selected_title: tit })}
                                className={`w-full text-left p-3 rounded-xl border text-sm font-bold transition-all ${
                                  onetakeResult.selected_title === tit
                                    ? 'bg-[#FFE600]/10 border-[#FFE600] text-[#FFE600]'
                                    : 'bg-[#13161c] border-[#232731] text-slate-200 hover:border-slate-600'
                                }`}
                              >
                                #{i + 1}. {tit}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3-Step Jab Script Segments with Audio Preview */}
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-300">
                            3단계 잽(Jab) 대본 및 TTS 오디오 미리듣기
                          </div>
                          {onetakeResult.script_segments.map((seg, idx) => {
                            const aud = onetakeResult.tts_timeline?.audios?.[idx];
                            return (
                              <div key={idx} className="p-4 rounded-xl bg-[#13161c] border border-[#232731] space-y-3">
                                <div className="flex items-center justify-between text-xs font-mono">
                                  <span className="px-2 py-0.5 rounded bg-[#202734] text-[#FFE600] font-bold">
                                    {seg.step} ({idx + 1}단계)
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {aud?.web_url && (
                                      <button
                                        onClick={() => togglePlayAudio(aud.web_url)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#252c3a] hover:bg-[#FFE600] hover:text-black text-slate-200 transition-colors"
                                      >
                                        {playingAudioUrl === aud.web_url ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                                        <span className="text-[11px] font-sans">음성 듣기</span>
                                      </button>
                                    )}
                                    <span className="text-slate-400">⏱ 약 {seg.est_duration}초</span>
                                  </div>
                                </div>
                                <textarea
                                  value={seg.text}
                                  onChange={(e) => {
                                    const copy = { ...onetakeResult };
                                    copy.script_segments[idx].text = e.target.value;
                                    setOnetakeResult(copy);
                                  }}
                                  rows={2}
                                  className="w-full bg-transparent text-sm text-slate-100 font-medium focus:outline-none resize-none"
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Direct CapCut Action */}
                        <div className="pt-2">
                          <button
                            onClick={() => setShowExportModal(true)}
                            className="w-full py-4 rounded-xl bg-[#FFE600] hover:bg-amber-400 text-black font-black text-base shadow-xl shadow-[#FFE600]/20 flex items-center justify-center gap-2 transition-all"
                          >
                            <Send className="w-5 h-5 fill-black" />
                            이 대본과 TTS로 캡컷(CapCut) 프로젝트 생성하기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. 롱투숏 (Long-to-Shorts) 엔진 탭 */}
          {activeTab === 'long2shorts' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-[#FFE600]" />
                    롱폼 영상 $\rightarrow$ 세로 쇼츠 9:16 자동 분할 엔진
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    10~30분 롱폼 영상의 타임라인/오디오 피크를 분석하여 바이럴 가능성이 가장 높은 30~50초 구간 3개를 자동 추출합니다.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={longVideoUrl}
                    onChange={(e) => setLongVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-[#13161c] border border-[#232731] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#FFE600]"
                  />
                  <button
                    onClick={handleRunLongToShorts}
                    disabled={isExtractingLong}
                    className="px-6 py-2.5 rounded-xl bg-[#FFE600] text-black font-bold text-sm hover:brightness-105 transition-all disabled:opacity-50"
                  >
                    {isExtractingLong ? "하이라이트 분석 중..." : "하이라이트 3개 검출"}
                  </button>
                </div>

                {longToShortsResult && (
                  <div className="space-y-4 pt-4 border-t border-[#232731]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{longToShortsResult.title}</h3>
                      <span className="text-xs font-mono text-[#FFE600]">
                        크롭 규격: {longToShortsResult.crop_aspect}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {longToShortsResult.highlights.map((hl) => (
                        <div key={hl.id} className="p-4 rounded-xl bg-[#13161c] border border-[#232731] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#FFE600]">바이럴 점수 {hl.viral_score}점</span>
                            <span className="text-xs font-mono text-slate-400">⏱ {hl.duration_sec}초</span>
                          </div>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{hl.title}</h4>
                          <div className="text-xs font-mono bg-[#202734] px-2.5 py-1 rounded text-slate-300">
                            타임코드: {Math.floor(hl.start_sec / 60)}:{(hl.start_sec % 60).toString().padStart(2, '0')} ~ {Math.floor(hl.end_sec / 60)}:{(hl.end_sec % 60).toString().padStart(2, '0')}
                          </div>
                          <p className="text-[11px] text-slate-400">{hl.reason}</p>
                          <button
                            onClick={() => {
                              alert(`구간 (${hl.start_sec}s ~ ${hl.end_sec}s)을 캡컷 타임라인에 9:16 세로 규격으로 배치합니다.`);
                            }}
                            className="w-full py-2 rounded-lg bg-[#202734] hover:bg-[#FFE600] hover:text-black text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            이 구간 캡컷으로 내보내기
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. 멀티유즈 SNS 패키저 탭 */}
          {activeTab === 'multiuse' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[#FFE600]" />
                    멀티유즈 (Multi-Use) SNS 메타데이터 자동 패키징
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    완성된 쇼츠 에셋을 유튜브 쇼츠, 인스타 릴스, 틱톡 규격에 맞는 제목, 설명문, 해시태그로 원클릭 복사합니다.
                  </p>
                </div>

                {!multiuseData ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    {isGeneratingMultiuse ? "메타데이터 생성 중..." : "후보 검수 탭에서 영상을 선택한 뒤 멀티유즈를 확인하세요."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* YouTube Shorts */}
                    <div className="p-5 rounded-2xl bg-[#13161c] border border-[#232731] space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-red-500 font-mono">YOUTUBE SHORTS</span>
                        <button
                          onClick={() => handleCopyClipboard(multiuseData.youtube.description, 'yt')}
                          className="text-xs flex items-center gap-1 text-[#FFE600] hover:underline"
                        >
                          {copiedKey === 'yt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === 'yt' ? '복사됨!' : '설명문 복사'}
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-slate-200">추천 제목:</div>
                        <div className="p-2.5 rounded-lg bg-[#0c0e12] text-slate-300 font-semibold">{multiuseData.youtube.title}</div>
                        <div className="font-bold text-slate-200 pt-1">고정 댓글 유도문:</div>
                        <div className="p-2.5 rounded-lg bg-[#0c0e12] text-slate-400">{multiuseData.youtube.pinned_comment}</div>
                        <div className="font-bold text-slate-200 pt-1">해시태그:</div>
                        <div className="p-2.5 rounded-lg bg-[#0c0e12] text-[#FFE600]">{multiuseData.youtube.hashtags}</div>
                      </div>
                    </div>

                    {/* Instagram Reels */}
                    <div className="p-5 rounded-2xl bg-[#13161c] border border-[#232731] space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-pink-500 font-mono">INSTAGRAM REELS</span>
                        <button
                          onClick={() => handleCopyClipboard(multiuseData.instagram.caption, 'ig')}
                          className="text-xs flex items-center gap-1 text-[#FFE600] hover:underline"
                        >
                          {copiedKey === 'ig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === 'ig' ? '복사됨!' : '캡션 복사'}
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-slate-200">릴스 캡션 & 해시태그:</div>
                        <div className="p-3 rounded-lg bg-[#0c0e12] text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                          {multiuseData.instagram.caption}
                        </div>
                      </div>
                    </div>

                    {/* TikTok */}
                    <div className="p-5 rounded-2xl bg-[#13161c] border border-[#232731] space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-teal-400 font-mono">TIKTOK VIRAL</span>
                        <button
                          onClick={() => handleCopyClipboard(multiuseData.tiktok.caption, 'tt')}
                          className="text-xs flex items-center gap-1 text-[#FFE600] hover:underline"
                        >
                          {copiedKey === 'tt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === 'tt' ? '복사됨!' : '문구 복사'}
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-slate-200">틱톡 바이럴 문구:</div>
                        <div className="p-3 rounded-lg bg-[#0c0e12] text-slate-300">{multiuseData.tiktok.caption}</div>
                        <div className="font-bold text-slate-200 pt-1">추천 사운드 가이드:</div>
                        <div className="p-2.5 rounded-lg bg-[#0c0e12] text-slate-400">{multiuseData.tiktok.sound_recommendation}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. 로컬 에이전트 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6 rounded-2xl space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#FFE600]" />
                로컬 캡컷 브릿지 데몬 진단
              </h2>

              <div className="p-4 rounded-xl bg-[#13161c] border border-[#232731] space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">에이전트 구동 상태</span>
                  <span className={`font-bold ${agentStatus.online ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {agentStatus.online ? '정상 작동 중 (Port 28765)' : '오프라인 (데몬 실행 필요)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CapCut Draft 폴더</span>
                  <span className="font-mono text-xs text-slate-300">{agentStatus.draft_dir || '미감지'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <h4 className="font-bold text-slate-200">에이전트 실행 방법:</h4>
                <div className="p-3 rounded-lg bg-black font-mono text-slate-300">
                  .\.venv\Scripts\python local_agent\agent.py
                </div>
                <p>
                  에이전트가 실행되면 웹 대시보드에서 [CapCut으로 보내기] 버튼 클릭 시, 
                  브라우저가 로컬 데몬과 직접 통신하여 1초 만에 프로젝트 파일을 작성하고 캡컷을 자동 실행합니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NEW WORKSPACE MODAL */}
      {showWsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full rounded-2xl p-6 space-y-4 border border-[#232731]">
            <h3 className="text-sm font-bold text-white">새 작업대 (Workspace) 생성</h3>
            <input
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="예: 냥냥이 프로젝트, 헬스 꿀팁"
              className="w-full bg-[#13161c] border border-[#232731] rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FFE600]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#202734] text-xs text-slate-300"
              >
                취소
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 rounded-xl bg-[#FFE600] text-xs text-black font-bold"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPCUT EXPORT MODAL */}
      {showExportModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 space-y-6 border border-[#232731]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FFE600]" />
                CapCut 프로젝트 내보내기 방식 선택
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Option B: Local Agent */}
            <div className="p-4 rounded-xl bg-[#161a22] border border-[#FFE600]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#FFE600] px-2 py-0.5 rounded bg-[#FFE600]/10 border border-[#FFE600]/30 font-mono">
                  추천 방식 (원클릭)
                </span>
                <span className={`text-xs ${agentStatus.online ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {agentStatus.online ? '● 에이전트 준비됨' : '○ 에이전트 미연결'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">옵션 B: 로컬 캡컷으로 즉시 주입 (1-Click)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                사용자 PC의 캡컷 폴더에 <code className="text-slate-200">draft_content.json</code> 및 오디오 파일을 자동 생성하고 캡컷 프로그램을 즉시 실행합니다.
              </p>
              <button
                onClick={handleInjectToCapCut}
                disabled={!agentStatus.online || !!injectingStatus}
                className="w-full py-3 rounded-xl bg-[#FFE600] text-black font-extrabold text-xs shadow-lg shadow-[#FFE600]/20 hover:brightness-105 transition-all disabled:opacity-40"
              >
                {injectingStatus || "캡컷으로 원클릭 전송 및 자동 열기"}
              </button>
            </div>

            {/* Option A: Direct Zip Download */}
            <div className="p-4 rounded-xl bg-[#12151b] border border-[#232731] space-y-2">
              <h4 className="text-sm font-bold text-slate-300">옵션 A: 드래프트 팩 (.zip) 다운로드</h4>
              <p className="text-xs text-slate-400">
                에이전트 없이 웹 브라우저에서 직접 완성된 프로젝트 압축 파일을 다운로드하여 캡컷 Draft 폴더에 수동으로 압축 해제합니다.
              </p>
              <a
                href={api.getZipDownloadUrl(selectedVideo.youtube_video_id)}
                download
                className="w-full py-2.5 rounded-xl bg-[#1f242d] hover:bg-[#2b323f] text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors block text-center"
              >
                <Download className="w-3.5 h-3.5" />
                드래프트 팩 (.zip) 수동 다운로드
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
