import React, { useState, useEffect, useMemo } from 'react';
import { Receipt, Plus, Edit2, Trash2, TrendingDown, Calendar, X, CheckCircle2, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { formatAmount, getAmountClassName } from '../../utils/formatAmount';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeRingClass } from '../../utils/getThemeClasses';

const LoansTab = ({ getTitle, reloadData, agreements }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [isEditLoanModalOpen, setIsEditLoanModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanForm, setLoanForm] = useState({
    name: '',
    lender: '',
    principal_amount: '',
    current_balance: '',
    interest_rate: '',
    monthly_payment: '',
    amortization_amount: '',
    interest_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'Aktiv',
    category: 'Bolån',
    note: '',
    agreement_id: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState(null);
  const [amortizationPlan, setAmortizationPlan] = useState([]);
  const [showAmortizationPlan, setShowAmortizationPlan] = useState(false);
  const [interestPeriods, setInterestPeriods] = useState([]);
  const [showInterestPeriods, setShowInterestPeriods] = useState(false);
  const [isAddInterestPeriodModalOpen, setIsAddInterestPeriodModalOpen] = useState(false);
  const [interestPeriodForm, setInterestPeriodForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    interest_rate: '',
    note: ''
  });

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const loansData = await api.getLoans();
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading loans:', error);
      showToast('Kunde inte ladda lån', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalDebt = useMemo(() => {
    return loans
      .filter(loan => loan.status === 'Aktiv')
      .reduce((sum, loan) => sum + (parseFloat(loan.current_balance) || 0), 0);
  }, [loans]);

  const totalMonthlyPayment = useMemo(() => {
    return loans
      .filter(loan => loan.status === 'Aktiv')
      .reduce((sum, loan) => sum + (parseFloat(loan.monthly_payment) || 0), 0);
  }, [loans]);

  const totalMonthlyInterest = useMemo(() => {
    return loans
      .filter(loan => loan.status === 'Aktiv')
      .reduce((sum, loan) => sum + (parseFloat(loan.interest_amount) || 0), 0);
  }, [loans]);

  // Filter loans
  const filteredLoans = useMemo(() => {
    if (!searchQuery) return loans;
    const query = searchQuery.toLowerCase();
    return loans.filter(loan =>
      loan.name?.toLowerCase().includes(query) ||
      loan.lender?.toLowerCase().includes(query) ||
      loan.category?.toLowerCase().includes(query) ||
      loan.status?.toLowerCase().includes(query) ||
      String(loan.current_balance).includes(query) ||
      String(loan.monthly_payment).includes(query)
    );
  }, [loans, searchQuery]);

  const handleAddLoan = () => {
    setLoanForm({
      name: '',
      lender: '',
      principal_amount: '',
      current_balance: '',
      interest_rate: '',
      monthly_payment: '',
      amortization_amount: '',
      interest_amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'Aktiv',
      category: 'Bolån',
      note: '',
      agreement_id: null
    });
    setIsAddLoanModalOpen(true);
  };

  const handleEditLoan = (loan) => {
    setSelectedLoan(loan);
    setLoanForm({
      name: loan.name || '',
      lender: loan.lender || '',
      principal_amount: loan.principal_amount || '',
      current_balance: loan.current_balance || '',
      interest_rate: loan.interest_rate || '',
      monthly_payment: loan.monthly_payment || '',
      amortization_amount: loan.amortization_amount || '',
      interest_amount: loan.interest_amount || '',
      start_date: loan.start_date || new Date().toISOString().split('T')[0],
      end_date: loan.end_date || '',
      status: loan.status || 'Aktiv',
      category: loan.category || 'Bolån',
      note: loan.note || '',
      agreement_id: loan.agreement_id || null
    });
    setIsEditLoanModalOpen(true);
  };

  const handleSaveLoan = async () => {
    try {
      const loanData = {
        name: loanForm.name,
        lender: loanForm.lender,
        principal_amount: parseFloat(loanForm.principal_amount) || 0,
        current_balance: parseFloat(loanForm.current_balance) || 0,
        interest_rate: parseFloat(loanForm.interest_rate) || 0,
        monthly_payment: parseFloat(loanForm.monthly_payment) || 0,
        amortization_amount: parseFloat(loanForm.amortization_amount) || 0,
        interest_amount: parseFloat(loanForm.interest_amount) || 0,
        start_date: loanForm.start_date,
        end_date: loanForm.end_date || null,
        status: loanForm.status || 'Aktiv',
        category: loanForm.category || 'Bolån',
        note: loanForm.note || '',
        agreement_id: loanForm.agreement_id && loanForm.agreement_id !== 'Ingen koppling' ? parseInt(loanForm.agreement_id) : null
      };

      if (selectedLoan) {
        await api.updateLoan(selectedLoan.id, loanData);
        showToast('Lån uppdaterat!', { type: 'success' });
      } else {
        await api.createLoan(loanData);
        showToast('Lån skapat!', { type: 'success' });
      }

      setIsAddLoanModalOpen(false);
      setIsEditLoanModalOpen(false);
      setSelectedLoan(null);
      await loadLoans();
      if (reloadData) await reloadData();
    } catch (error) {
      console.error('Error saving loan:', error);
      showToast('Kunde inte spara lån', { type: 'error' });
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Är du säker på att du vill radera detta lån?')) return;

    try {
      await api.deleteLoan(loanId);
      showToast('Lån raderat!', { type: 'success' });
      await loadLoans();
      if (reloadData) await reloadData();
    } catch (error) {
      console.error('Error deleting loan:', error);
      showToast('Kunde inte radera lån', { type: 'error' });
    }
  };

  const handleViewAmortizationPlan = async (loan) => {
    try {
      const plan = await api.getAmortizationPlan(loan.id);
      setAmortizationPlan(plan);
      setSelectedLoanForDetails(loan);
      setShowAmortizationPlan(true);
    } catch (error) {
      console.error('Error loading amortization plan:', error);
      showToast('Kunde inte ladda amorteringsplan', { type: 'error' });
    }
  };

  const handleViewInterestPeriods = async (loan) => {
    try {
      const periods = await api.getLoanInterestPeriods(loan.id);
      setInterestPeriods(periods);
      setSelectedLoanForDetails(loan);
      setShowInterestPeriods(true);
    } catch (error) {
      console.error('Error loading interest periods:', error);
      showToast('Kunde inte ladda ränteperioder', { type: 'error' });
    }
  };

  const handleAddInterestPeriod = () => {
    setInterestPeriodForm({
      start_date: new Date().toISOString().split('T')[0],
      interest_rate: selectedLoanForDetails?.interest_rate || '',
      note: ''
    });
    setIsAddInterestPeriodModalOpen(true);
  };

  const handleSaveInterestPeriod = async () => {
    if (!selectedLoanForDetails) return;

    try {
      await api.createLoanInterestPeriod(selectedLoanForDetails.id, {
        start_date: interestPeriodForm.start_date,
        interest_rate: parseFloat(interestPeriodForm.interest_rate),
        note: interestPeriodForm.note
      });

      showToast('Ränteperiod tillagd!', { type: 'success' });
      setIsAddInterestPeriodModalOpen(false);
      await handleViewInterestPeriods(selectedLoanForDetails);
      await loadLoans();
      if (reloadData) await reloadData();
    } catch (error) {
      console.error('Error saving interest period:', error);
      showToast('Kunde inte spara ränteperiod', { type: 'error' });
    }
  };

  // Get active insurance agreements for linking
  const activeAgreements = useMemo(() => {
    return agreements?.filter(agreement => 
      agreement.status === 'Aktiv' && 
      (agreement.category === 'Försäkring' || agreement.category?.toLowerCase().includes('försäkring'))
    ) || [];
  }, [agreements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Laddar lån...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Skuld</p>
              <p className={`text-2xl font-semibold mt-1 ${getAmountClassName(-totalDebt)}`}>
                {formatAmount(-totalDebt)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Månadsbetalning</p>
              <p className={`text-2xl font-semibold mt-1 ${getAmountClassName(-totalMonthlyPayment)}`}>
                {formatAmount(-totalMonthlyPayment)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Månadsränta</p>
              <p className={`text-2xl font-semibold mt-1 ${getAmountClassName(-totalMonthlyInterest)}`}>
                {formatAmount(-totalMonthlyInterest)}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Sök lån..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
          />
        </div>
        <button
          onClick={handleAddLoan}
          className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg transition-colors flex items-center gap-2`}
        >
          <Plus className="w-4 h-4" />
          Lägg till Lån
        </button>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Namn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Långivare</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Återstående Skuld</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Månadsbetalning</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Räntesats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    {searchQuery ? 'Inga lån hittades' : 'Inga lån ännu'}
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {loan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {loan.lender}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAmountClassName(-loan.current_balance)}`}>
                      {formatAmount(-loan.current_balance)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAmountClassName(-loan.monthly_payment)}`}>
                      {formatAmount(-loan.monthly_payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {loan.interest_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        loan.status === 'Aktiv' 
                          ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                          : loan.status === 'Avslutat'
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewAmortizationPlan(loan)}
                          className={`${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} hover:opacity-80`}
                          title="Visa amorteringsplan"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewInterestPeriods(loan)}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                          title="Visa ränteperioder"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditLoan(loan)}
                          className={`${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} hover:opacity-80`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Loan Modal */}
      {(isAddLoanModalOpen || isEditLoanModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {selectedLoan ? 'Redigera Lån' : 'Lägg till Lån'}
              </h2>
              <button
                onClick={() => {
                  setIsAddLoanModalOpen(false);
                  setIsEditLoanModalOpen(false);
                  setSelectedLoan(null);
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Lånenamn *
                </label>
                <input
                  type="text"
                  value={loanForm.name}
                  onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Långivare *
                </label>
                <input
                  type="text"
                  value={loanForm.lender}
                  onChange={(e) => setLoanForm({ ...loanForm, lender: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Ursprungligt Belopp *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.principal_amount}
                    onChange={(e) => setLoanForm({ ...loanForm, principal_amount: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nuvarande Skuld *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.current_balance}
                    onChange={(e) => setLoanForm({ ...loanForm, current_balance: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Räntesats (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={loanForm.interest_rate}
                  onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 mb-4 border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">💡 Förklaring:</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  <strong>Månadsbetalning</strong> = Amortering + Ränta (total betalning per månad)
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  <strong>Amortering</strong> = Den del som betalar av lånet (huvudstolen)
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  <strong>Ränta</strong> = Räntekostnaden per månad
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Månadsbetalning * <span className="text-xs text-zinc-500">(Total)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.monthly_payment}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLoanForm({ ...loanForm, monthly_payment: newValue });
                      // Auto-calculate if both amortization and interest are filled
                      if (loanForm.amortization_amount && loanForm.interest_amount) {
                        const total = parseFloat(loanForm.amortization_amount) + parseFloat(loanForm.interest_amount);
                        if (Math.abs(parseFloat(newValue) - total) > 0.01) {
                          // User changed total, so we don't auto-update
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="10 000"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Amortering + Ränta</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Amortering * <span className="text-xs text-zinc-500">(Huvudstol)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.amortization_amount}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLoanForm({ ...loanForm, amortization_amount: newValue });
                      // Auto-calculate monthly payment if interest is also filled
                      if (newValue && loanForm.interest_amount) {
                        const total = parseFloat(newValue) + parseFloat(loanForm.interest_amount);
                        setLoanForm(prev => ({ ...prev, monthly_payment: total.toFixed(2) }));
                      }
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="6 000"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Betalar av lånet</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Ränta * <span className="text-xs text-zinc-500">(Kostnad)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.interest_amount}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLoanForm({ ...loanForm, interest_amount: newValue });
                      // Auto-calculate monthly payment if amortization is also filled
                      if (newValue && loanForm.amortization_amount) {
                        const total = parseFloat(newValue) + parseFloat(loanForm.amortization_amount);
                        setLoanForm(prev => ({ ...prev, monthly_payment: total.toFixed(2) }));
                      }
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="4 000"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Räntekostnad</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Startdatum *
                  </label>
                  <input
                    type="date"
                    value={loanForm.start_date}
                    onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Slutdatum
                  </label>
                  <input
                    type="date"
                    value={loanForm.end_date}
                    onChange={(e) => setLoanForm({ ...loanForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={loanForm.status}
                    onChange={(e) => setLoanForm({ ...loanForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Aktiv">Aktiv</option>
                    <option value="Avslutat">Avslutat</option>
                    <option value="Pausad">Pausad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={loanForm.category}
                    onChange={(e) => setLoanForm({ ...loanForm, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {activeAgreements.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Koppla till Avtal (valfritt)
                  </label>
                  <select
                    value={loanForm.agreement_id || ''}
                    onChange={(e) => setLoanForm({ ...loanForm, agreement_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Ingen koppling</option>
                    {activeAgreements.map(agreement => (
                      <option key={agreement.id} value={agreement.id}>
                        {agreement.name} - {agreement.provider}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Noteringar
                </label>
                <textarea
                  value={loanForm.note}
                  onChange={(e) => setLoanForm({ ...loanForm, note: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddLoanModalOpen(false);
                  setIsEditLoanModalOpen(false);
                  setSelectedLoan(null);
                }}
                className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSaveLoan}
                className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg transition-colors`}
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amortization Plan Modal */}
      {showAmortizationPlan && selectedLoanForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Amorteringsplan - {selectedLoanForDetails.name}
              </h2>
              <button
                onClick={() => {
                  setShowAmortizationPlan(false);
                  setSelectedLoanForDetails(null);
                  setAmortizationPlan([]);
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Månad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Datum</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Återstående Skuld</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Amortering</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Ränta</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Extra</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Totalt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {amortizationPlan.slice(0, 60).map((entry, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">{entry.month}</td>
                      <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{entry.date}</td>
                      <td className={`px-4 py-2 text-right font-medium ${getAmountClassName(-entry.balance)}`}>
                        {formatAmount(-entry.balance)}
                      </td>
                      <td className={`px-4 py-2 text-right ${getAmountClassName(-entry.principal_paid)}`}>
                        {formatAmount(-entry.principal_paid)}
                      </td>
                      <td className={`px-4 py-2 text-right ${getAmountClassName(-entry.interest_paid)}`}>
                        {formatAmount(-entry.interest_paid)}
                      </td>
                      <td className={`px-4 py-2 text-right ${getAmountClassName(-entry.extra_payment)}`}>
                        {entry.extra_payment > 0 ? formatAmount(-entry.extra_payment) : '-'}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${getAmountClassName(-entry.total_payment)}`}>
                        {formatAmount(-entry.total_payment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {amortizationPlan.length > 60 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 text-center">
                  Visar första 60 månaderna av {amortizationPlan.length} totalt
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansTab;

