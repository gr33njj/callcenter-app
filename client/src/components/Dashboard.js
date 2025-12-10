import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar, TrendingUp, Phone, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const Dashboard = () => {
  const { user, logout, isSupervisor, isManagement } = useAuth();
  const [view, setView] = useState(isSupervisor ? 'supervisor' : 'management');
  const [operators, setOperators] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddingOperator, setIsAddingOperator] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [newOperatorName, setNewOperatorName] = useState('');
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = [
    { id: 'morning', label: '08:00 - 12:00' },
    { id: 'afternoon', label: '12:00 - 18:00' },
    { id: 'evening', label: '18:00 - 20:00' }
  ];

  const [reportForm, setReportForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    operator_id: '',
    time_slot: 'morning',
    total_calls_cumulative: 0,
    incoming_accepted: 0,
    outgoing_made: 0,
    missed: 0,
    time_on_line: 0,
    time_in_calls: 0,
    recordings: 0
  });

  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    if (view === 'management') {
      loadDailyStats();
      loadMonthlyStats();
    }
  }, [view, selectedDate, selectedMonth]);

  const loadOperators = async () => {
    try {
      setLoading(true);
      const response = await api.getOperators();
      setOperators(response.data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки операторов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await api.getDailyStats({ date: selectedDate });
      setDailyStats(response.data);
    } catch (err) {
      console.error('Error loading daily stats:', err);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const response = await api.getMonthlyStats({ month: selectedMonth });
      setMonthlyStats(response.data);
    } catch (err) {
      console.error('Error loading monthly stats:', err);
    }
  };

  const addOperator = async () => {
    if (newOperatorName.trim()) {
      try {
        await api.createOperator({ full_name: newOperatorName.trim() });
        setNewOperatorName('');
        setIsAddingOperator(false);
        loadOperators();
      } catch (err) {
        setError('Ошибка добавления оператора');
        console.error(err);
      }
    }
  };

  const deleteOperator = async (id) => {
    if (window.confirm('Удалить этого оператора?')) {
      try {
        await api.deleteOperator(id);
        loadOperators();
      } catch (err) {
        setError('Ошибка удаления оператора');
        console.error(err);
      }
    }
  };

  const updateOperatorName = async (id, newName) => {
    try {
      await api.updateOperator(id, { full_name: newName });
      setEditingOperator(null);
      loadOperators();
    } catch (err) {
      setError('Ошибка обновления оператора');
      console.error(err);
    }
  };

  const addReport = async () => {
    if (!reportForm.operator_id) {
      alert('Выберите оператора');
      return;
    }

    try {
      await api.createReport(reportForm);
      setIsAddingReport(false);
      setReportForm({
        report_date: new Date().toISOString().split('T')[0],
        operator_id: '',
        time_slot: 'morning',
        total_calls_cumulative: 0,
        incoming_accepted: 0,
        outgoing_made: 0,
        missed: 0,
        time_on_line: 0,
        time_in_calls: 0,
        recordings: 0
      });
      // Всегда обновляем статистику после добавления отчета
      loadDailyStats();
      loadMonthlyStats();
      alert('Отчет успешно сохранен!');
    } catch (err) {
      setError('Ошибка сохранения отчета');
      console.error(err);
    }
  };

  const calculateTimeSlotData = (operatorReports, date, timeSlotId) => {
    const slotIndex = timeSlots.findIndex(s => s.id === timeSlotId);
    const previousSlot = slotIndex > 0 ? timeSlots[slotIndex - 1] : null;

    const currentReport = operatorReports.find(r => 
      r.report_date === date && r.time_slot === timeSlotId
    );
    
    const previousReport = previousSlot ? operatorReports.find(r => 
      r.report_date === date && r.time_slot === previousSlot.id
    ) : null;

    if (!currentReport) return null;

    const prevCumulative = previousReport ? previousReport.total_calls_cumulative : 0;
    const actualCalls = currentReport.total_calls_cumulative - prevCumulative;

    return {
      ...currentReport,
      actualCalls,
      avgCallDuration: currentReport.time_in_calls > 0 ? 
        (currentReport.time_in_calls / actualCalls).toFixed(1) : 0
    };
  };

  const getDailyStatsForOperator = (operatorId) => {
    // Приводим типы к числу для корректного сравнения
    const operatorReports = dailyStats.filter(r => 
      Number(r.operator_id) === Number(operatorId)
    );
    
    // Проверяем, есть ли хоть какие-то отчеты для этого оператора
    if (operatorReports.length === 0) {
      return null;
    }
    
    let totalCalls = 0;
    let totalRecordings = 0;
    let totalTimeInCalls = 0;
    let totalTimeOnLine = 0;
    let totalIncoming = 0;
    let totalOutgoing = 0;
    let totalMissed = 0;

    timeSlots.forEach(slot => {
      const data = calculateTimeSlotData(operatorReports, selectedDate, slot.id);
      if (data) {
        totalCalls += data.actualCalls;
        totalRecordings += data.recordings;
        totalTimeInCalls += data.time_in_calls;
        totalTimeOnLine += data.time_on_line;
        totalIncoming += data.incoming_accepted;
        totalOutgoing += data.outgoing_made;
        totalMissed += data.missed;
      }
    });

    const avgCallDuration = totalCalls > 0 ? (totalTimeInCalls / totalCalls).toFixed(1) : 0;
    const utilizationRate = totalTimeOnLine > 0 ? 
      ((totalTimeInCalls / totalTimeOnLine) * 100).toFixed(1) : 0;

    return {
      totalCalls,
      totalRecordings,
      totalTimeInCalls,
      totalTimeOnLine,
      totalIncoming,
      totalOutgoing,
      totalMissed,
      avgCallDuration,
      utilizationRate,
      reports: operatorReports
    };
  };

  const getMonthlyStatsForOperator = (operatorId) => {
    // Приводим типы к числу для корректного сравнения
    const operatorReports = monthlyStats.filter(r => 
      Number(r.operator_id) === Number(operatorId)
    );
    
    // Проверяем, есть ли хоть какие-то отчеты
    if (operatorReports.length === 0) return null;
    
    // Фильтруем только валидные даты (не NULL)
    const uniqueDates = [...new Set(
      operatorReports
        .map(r => r.report_date)
        .filter(d => d !== null && d !== undefined)
    )];

    let totalCalls = 0;
    let totalRecordings = 0;
    let totalTimeInCalls = 0;
    let totalTimeOnLine = 0;

    uniqueDates.forEach(date => {
      timeSlots.forEach(slot => {
        const data = calculateTimeSlotData(operatorReports, date, slot.id);
        if (data) {
          totalCalls += data.actualCalls;
          totalRecordings += data.recordings;
          totalTimeInCalls += data.time_in_calls;
          totalTimeOnLine += data.time_on_line;
        }
      });
    });

    const avgCallDuration = totalCalls > 0 ? (totalTimeInCalls / totalCalls).toFixed(1) : 0;
    const utilizationRate = totalTimeOnLine > 0 ? 
      ((totalTimeInCalls / totalTimeOnLine) * 100).toFixed(1) : 0;
    const avgCallsPerDay = uniqueDates.length > 0 ? (totalCalls / uniqueDates.length).toFixed(1) : 0;

    return {
      totalCalls,
      totalRecordings,
      avgCallDuration,
      utilizationRate,
      workingDays: uniqueDates.length,
      avgCallsPerDay
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b pb-4 sm:pb-6 gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                <Phone className="text-indigo-600" size={32} />
                <span className="hidden sm:inline">Отчетность Колл-Центра</span>
                <span className="sm:hidden">Отчетность</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-2 hidden sm:block">Мониторинг эффективности операторов</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                <span className="hidden sm:inline">Пользователь: </span>
                <span className="font-medium">{user?.username}</span> ({user?.role})
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto flex-wrap">
              {isSupervisor && (
                <button
                  onClick={() => setView('supervisor')}
                  className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex-1 sm:flex-initial ${
                    view === 'supervisor'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Ввод данных</span>
                  <span className="sm:hidden">Ввод</span>
                </button>
              )}
              {isManagement && (
                <button
                  onClick={() => setView('management')}
                  className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex-1 sm:flex-initial ${
                    view === 'management'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Отчеты
                </button>
              )}
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <LogOut size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Выход</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {view === 'supervisor' && isSupervisor && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users size={24} className="text-indigo-600" />
                    Список операторов
                  </h2>
                  {!isAddingOperator && (
                    <button
                      onClick={() => setIsAddingOperator(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md"
                    >
                      <Plus size={20} />
                      Добавить оператора
                    </button>
                  )}
                </div>

                {isAddingOperator && (
                  <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex gap-3">
                    <input
                      type="text"
                      placeholder="ФИО оператора"
                      value={newOperatorName}
                      onChange={(e) => setNewOperatorName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addOperator()}
                    />
                    <button
                      onClick={addOperator}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save size={20} />
                      Сохранить
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingOperator(false);
                        setNewOperatorName('');
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center gap-2"
                    >
                      <X size={20} />
                      Отмена
                    </button>
                  </div>
                )}

                <div className="grid gap-3">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Загрузка...</div>
                  ) : operators.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Нет операторов</div>
                  ) : (
                    operators.map(operator => (
                      <div key={operator.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                        {editingOperator === operator.id ? (
                          <input
                            type="text"
                            defaultValue={operator.full_name}
                            onBlur={(e) => updateOperatorName(operator.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateOperatorName(operator.id, e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-gray-800">{operator.full_name}</span>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingOperator(operator.id)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteOperator(operator.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} className="text-green-600" />
                  Добавить отчет
                </h2>
                
                {!isAddingReport ? (
                  <button
                    onClick={() => setIsAddingReport(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md transition-all"
                  >
                    <Plus size={20} />
                    Новый отчет
                  </button>
                ) : (
                  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                        <input
                          type="date"
                          value={reportForm.report_date}
                          onChange={(e) => setReportForm({...reportForm, report_date: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Оператор</label>
                        <select
                          value={reportForm.operator_id}
                          onChange={(e) => setReportForm({...reportForm, operator_id: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Выберите оператора</option>
                          {operators.map(op => (
                            <option key={op.id} value={op.id}>{op.full_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Временной период</label>
                        <select
                          value={reportForm.time_slot}
                          onChange={(e) => setReportForm({...reportForm, time_slot: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          {timeSlots.map(slot => (
                            <option key={slot.id} value={slot.id}>{slot.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Всего звонков (нарастающим итогом)
                        </label>
                        <input
                          type="number"
                          value={reportForm.total_calls_cumulative}
                          onChange={(e) => setReportForm({...reportForm, total_calls_cumulative: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Принято входящих</label>
                        <input
                          type="number"
                          value={reportForm.incoming_accepted}
                          onChange={(e) => setReportForm({...reportForm, incoming_accepted: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Совершено исходящих</label>
                        <input
                          type="number"
                          value={reportForm.outgoing_made}
                          onChange={(e) => setReportForm({...reportForm, outgoing_made: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Пропущено</label>
                        <input
                          type="number"
                          value={reportForm.missed}
                          onChange={(e) => setReportForm({...reportForm, missed: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Время на линии (мин)</label>
                        <input
                          type="number"
                          value={reportForm.time_on_line}
                          onChange={(e) => setReportForm({...reportForm, time_on_line: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Время в звонках (мин)</label>
                        <input
                          type="number"
                          value={reportForm.time_in_calls}
                          onChange={(e) => setReportForm({...reportForm, time_in_calls: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Записи</label>
                        <input
                          type="number"
                          value={reportForm.recordings}
                          onChange={(e) => setReportForm({...reportForm, recordings: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={addReport}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md"
                      >
                        <Save size={20} />
                        Сохранить отчет
                      </button>
                      <button
                        onClick={() => setIsAddingReport(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 flex items-center gap-2"
                      >
                        <X size={20} />
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'management' && isManagement && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={24} className="text-purple-600" />
                  Фильтры
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дневной отчет</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Месячный отчет</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Дневной отчет - {selectedDate}</h3>
                <div className="space-y-6">
                  {operators.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Нет операторов в системе
                    </div>
                  ) : (
                    operators.map(operator => {
                      const stats = getDailyStatsForOperator(operator.id);
                      
                      if (!stats) {
                        return (
                          <div key={operator.id} className="border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-bold text-gray-800 mb-4">{operator.full_name}</h4>
                            <div className="text-center py-8 text-gray-500">
                              Нет данных за выбранную дату
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={operator.id} className="border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-4">{operator.full_name}</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                            {timeSlots.map(slot => {
                              const slotData = calculateTimeSlotData(stats.reports, selectedDate, slot.id);
                              if (!slotData) return (
                                <div key={slot.id} className="bg-gray-50 p-4 rounded-lg">
                                  <div className="text-sm font-medium text-gray-500 mb-2">{slot.label}</div>
                                  <div className="text-gray-400">Нет данных</div>
                                </div>
                              );

                              return (
                                <div key={slot.id} className="bg-indigo-50 p-4 rounded-lg">
                                  <div className="text-sm font-medium text-indigo-700 mb-3">{slot.label}</div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Звонков:</span>
                                      <span className="font-semibold">{slotData.actualCalls}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Записей:</span>
                                      <span className="font-semibold">{slotData.recordings}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Ср. длит.:</span>
                                      <span className="font-semibold">{slotData.avgCallDuration} мин</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-5 rounded-lg">
                            <h5 className="font-bold text-gray-800 mb-3">KPI за день</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                              <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.totalCalls}</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Всего звонков</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalRecordings}</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Записей</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.avgCallDuration}</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Ср. длит. (мин)</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.utilizationRate}%</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Утилизация</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Месячный отчет - {selectedMonth}</h3>
                <div className="space-y-6">
                  {operators.map(operator => {
                    const stats = getMonthlyStatsForOperator(operator.id);
                    if (!stats) return null;

                    return (
                      <div key={operator.id} className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">{operator.full_name}</h4>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-lg">
                          <h5 className="font-bold text-gray-800 mb-3">KPI за месяц</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.totalCalls}</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">Всего звонков</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalRecordings}</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">Записей</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.avgCallDuration}</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">Ср. длит. (мин)</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.utilizationRate}%</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">Утилизация</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.workingDays}</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">Рабочих дней</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-teal-600">{stats.avgCallsPerDay}</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">Ср. звонков/день</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
