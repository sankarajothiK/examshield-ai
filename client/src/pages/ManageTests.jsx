import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash, Upload, Check, Edit2, AlertCircle, Save, Calendar, Clock, ListChecks } from 'lucide-react';
import api from '../services/api';

const ManageTests = () => {
  const navigate = useNavigate();

  // Test Settings State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [passingMarks, setPassingMarks] = useState(5);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [status, setStatus] = useState('draft');
  const [instructions, setInstructions] = useState(['Keep webcam active.', 'No tab switching allowed.']);
  const [newInstruction, setNewInstruction] = useState('');

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'questions'
  const [dragActive, setDragActive] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual Question entry state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualOpts, setManualOpts] = useState(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState(0);
  const [manualMarks, setManualMarks] = useState(1);
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState('medium');
  const [manualSubject, setManualSubject] = useState('Biology');

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction('');
    }
  };

  const removeInstruction = (idx) => {
    setInstructions(instructions.filter((_, i) => i !== idx));
  };

  // Bulk File Uploader parser trigger
  const handleFileUpload = async (file) => {
    setUploadLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.uploadFile('/uploads/questions', file);
      if (res.success) {
        setQuestions([...questions, ...res.data]);
        setSuccessMsg(`Successfully parsed and loaded ${res.count} questions from ${file.name}!`);
        setActiveTab('questions');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse file. Make sure it follows the structured pattern.');
    } finally {
      setUploadLoading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Manual Add Question Helper
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualText || manualOpts.some(o => !o.trim())) {
      setErrorMsg('Please specify question text and all 4 options.');
      return;
    }

    const newQ = {
      text: manualText,
      options: [...manualOpts],
      correctAnswer: manualCorrect,
      marks: manualMarks,
      explanation: manualExplanation,
      difficulty: manualDifficulty,
      subject: manualSubject,
      category: manualSubject,
    };

    setQuestions([...questions, newQ]);
    
    // Reset manual form fields
    setManualText('');
    setManualOpts(['', '', '', '']);
    setManualCorrect(0);
    setManualExplanation('');
    setShowManualForm(false);
    setSuccessMsg('Manual question appended to list.');
  };

  // Delete question from temp test list
  const deleteTempQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  // Submit test creator configurations to backend
  const handleSaveTest = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || !duration || !passingMarks || !startDate || !endDate) {
      setErrorMsg('Please complete all settings fields before saving.');
      return;
    }

    if (questions.length === 0) {
      setErrorMsg('You must add at least one question to the test.');
      return;
    }

    try {
      const payload = {
        title,
        description,
        duration: parseInt(duration),
        passingMarks: parseFloat(passingMarks),
        negativeMarks: parseFloat(negativeMarks),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        instructions,
        maxAttempts: parseInt(maxAttempts),
        status,
        questions, // full questions array (backend handles insertMany)
      };

      const res = await api.post('/tests', payload);
      if (res.success) {
        setSuccessMsg('Test created and published successfully!');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not save examination test.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            Create Online Examination
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build high-stakes exam modules, configure proctor thresholds, and upload question matrices.
          </p>
        </div>
        <button
          onClick={handleSaveTest}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
        >
          <Save size={14} /> Save Examination
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-6 flex items-start gap-2 border border-red-100 dark:border-red-900/20">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-xl mb-6 flex items-start gap-2 border border-green-100 dark:border-green-900/20">
          <Check size={16} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
            activeTab === 'settings'
              ? 'border-brand-500 text-brand-600 dark:text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          ⚙️ General Exam Settings
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all flex items-center gap-1.5 ${
            activeTab === 'questions'
              ? 'border-brand-500 text-brand-600 dark:text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📝 Questions Matrix ({questions.length})
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Fields */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 glassmorphism rounded-2xl shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Test Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physiology Final Entrance mock test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Description / Sub-header
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly state exam syllabus scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                    />
                    <Clock size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Negative Marking (Per Wrong Answer)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Start Window Date/Time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                    />
                    <Calendar size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    End Window Date/Time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                    />
                    <Calendar size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Maximum Attempt Limits
                  </label>
                  <input
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Portal Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  >
                    <option value="draft">Draft - Offline</option>
                    <option value="published">Published - Live to Students</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Instructions list */}
          <div className="lg:col-span-4">
            <div className="p-6 glassmorphism rounded-2xl shadow-sm h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4">
                  📝 Student Instructions
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {instructions.map((inst, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 rounded-xl flex items-start justify-between gap-2"
                    >
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {i + 1}. {inst}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeInstruction(i)}
                        className="text-red-500 hover:text-red-700 shrink-0"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add rule instruction..."
                    value={newInstruction}
                    onChange={(e) => setNewInstruction(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-[10px] focus:outline-none dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Question Add Selection Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* File Drag Drop Bulk Parser */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/10'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <Upload size={32} className="text-slate-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Bulk Question Extractor
              </h4>
              <p className="text-[10px] text-slate-400 text-center mt-1 leading-normal max-w-xs">
                Drag and drop CSV or Text files here. <br />
                System automatically detects Q:, Option blocks, and Correct Answers.
              </p>
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('file-upload-input').click()}
                disabled={uploadLoading}
                className="mt-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all"
              >
                {uploadLoading ? 'Uploading & Parsing...' : 'Select Question File'}
              </button>
            </div>

            {/* Manual Question Adder Card */}
            <div className="p-6 glassmorphism rounded-2xl shadow-sm flex flex-col items-start justify-center">
              <Plus size={32} className="text-slate-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Manual Input Builder
              </h4>
              <p className="text-[10px] text-slate-400 text-left mt-1 leading-normal max-w-xs">
                Compose custom multiple choice questions manually. Configure marking metrics, category tags, and explanation blocks.
              </p>
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="mt-4 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold transition-all"
              >
                {showManualForm ? 'Hide Creator Form' : 'Launch Custom Builder'}
              </button>
            </div>
          </div>

          {/* Manual Entry Form */}
          {showManualForm && (
            <form onSubmit={handleManualAdd} className="p-6 glassmorphism rounded-2xl shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Question Text
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which of the following organelles is known as the powerhouse of the cell?"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {manualOpts.map((opt, i) => (
                  <div key={i}>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                      Option {String.fromCharCode(65 + i)}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Option value...`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...manualOpts];
                        copy[i] = e.target.value;
                        setManualOpts(copy);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Correct Option Index
                  </label>
                  <select
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Marks weight
                  </label>
                  <input
                    type="number"
                    value={manualMarks}
                    onChange={(e) => setManualMarks(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Subject / Category
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Difficulty
                  </label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Answer Explanation
                </label>
                <input
                  type="text"
                  placeholder="Brief rational explaining correct answer..."
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow"
              >
                Append Question
              </button>
            </form>
          )}

          {/* List of current questions parsed / manually added */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">
              Extracted Questions Matrix
            </h3>

            {questions.length === 0 ? (
              <div className="glassmorphism p-12 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800">
                Question matrix is currently empty. Use the manual builder or bulk file extractor above to load questions.
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl relative shadow-sm"
                  >
                    <button
                      onClick={() => deleteTempQuestion(idx)}
                      className="absolute right-4 top-4 text-red-500 hover:text-red-700"
                      title="Delete Question"
                    >
                      <Trash size={14} />
                    </button>

                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase">
                        Q #{idx + 1}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 rounded uppercase">
                        {q.subject}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-tealbrand-50 dark:bg-tealbrand-950/60 text-tealbrand-700 dark:text-tealbrand-400 rounded uppercase">
                        {q.difficulty}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {q.marks} Mark(s)
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal max-w-[90%]">
                      {q.text}
                    </h4>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${
                            oIdx === q.correctAnswer
                              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/20 font-bold'
                              : 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 border border-slate-100 dark:border-slate-800/40'
                          }`}
                        >
                          <span className="font-extrabold">{String.fromCharCode(65 + oIdx)}).</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[10px] text-slate-400 mt-2.5 italic">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTests;
