import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash, Edit2, AlertCircle, Check, Loader2 } from 'lucide-react';
import api from '../services/api';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [editOpts, setEditOpts] = useState(['', '', '', '']);
  const [editCorrect, setEditCorrect] = useState(0);
  const [editMarks, setEditMarks] = useState(1);
  const [editExplanation, setEditExplanation] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = '/questions';
      const params = [];
      if (difficultyFilter) params.push(`difficulty=${difficultyFilter}`);
      if (subjectFilter) params.push(`subject=${subjectFilter}`);
      if (searchQuery) params.push(`search=${searchQuery}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      if (res.success) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [difficultyFilter, subjectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Trigger Delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question? It will be removed from any exam referencing it.')) {
      try {
        const res = await api.delete(`/questions/${id}`);
        if (res.success) {
          setSuccessMsg('Question removed successfully!');
          setQuestions(questions.filter(q => q._id !== id));
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to remove question.');
      }
    }
  };

  // Launch edit modal values
  const startEdit = (q) => {
    setEditingQuestion(q);
    setEditText(q.text);
    setEditOpts([...q.options]);
    setEditCorrect(q.correctAnswer);
    setEditMarks(q.marks);
    setEditExplanation(q.explanation || '');
  };

  // Save edit question
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText || editOpts.some(o => !o.trim())) {
      setErrorMsg('Please specify question text and all 4 options.');
      return;
    }

    try {
      const payload = {
        text: editText,
        options: editOpts,
        correctAnswer: editCorrect,
        marks: editMarks,
        explanation: editExplanation,
      };

      const res = await api.put(`/questions/${editingQuestion._id}`, payload);
      if (res.success) {
        setSuccessMsg('Question updated successfully!');
        setEditingQuestion(null);
        fetchQuestions();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to edit question.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans">
          Question Bank Manager
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review, search, sort, and edit the entire catalog of database questions.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-4 flex items-start gap-2 border border-red-100 dark:border-red-900/20">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-xl mb-4 flex items-start gap-2 border border-green-100 dark:border-green-900/20">
          <Check size={16} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter tools */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search questions by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
        </form>

        <div className="flex gap-4 w-full md:w-auto">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100 w-full md:w-auto"
          >
            <option value="">All Subjects</option>
            <option value="Biology">Biology</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Physics">Physics</option>
            <option value="General">General</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100 w-full md:w-auto"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-brand-500 mx-auto mb-2" size={24} />
          <span className="text-xs text-slate-500">Syncing Question Bank...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 glassmorphism rounded-2xl">
          Zero matching questions found. Create tests to load bank contents.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <div
              key={q._id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl relative shadow-sm hover:border-slate-350 transition-colors"
            >
              {/* Question Actions */}
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <button
                  onClick={() => startEdit(q)}
                  className="p-1.5 text-slate-400 hover:text-brand-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  title="Edit Question"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(q._id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  title="Delete Question"
                >
                  <Trash size={13} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex gap-2 items-center mb-2">
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

              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[85%] leading-normal">
                {q.text}
              </h4>

              {/* Options list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {q.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`p-2 rounded-xl text-[10px] flex items-center gap-1.5 ${
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
                <p className="text-[9px] text-slate-400 mt-2.5 italic">
                  Explanation: {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Question Overlay Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-6">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Modify Question Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Question Text
              </label>
              <input
                type="text"
                required
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editOpts.map((opt, i) => (
                <div key={i}>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">
                    Option {String.fromCharCode(65 + i)}
                  </label>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const copy = [...editOpts];
                      copy[i] = e.target.value;
                      setEditOpts(copy);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                  Correct Answer
                </label>
                <select
                  value={editCorrect}
                  onChange={(e) => setEditCorrect(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                  Marks weight
                </label>
                <input
                  type="number"
                  value={editMarks}
                  onChange={(e) => setEditMarks(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Explanation
              </label>
              <input
                type="text"
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs"
              >
                Save Edits
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
