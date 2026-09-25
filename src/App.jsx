import { useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import LoanForm from './components/LoanForm.jsx'
import LoanList from './components/LoanList.jsx'
import LoginForm from './components/LoginForm.jsx'
import SearchBox from './components/SearchBox.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { getSession, login, logout, onAuthStateChange } from './lib/auth.js'
import { toIsoDate } from './lib/dateFormat.js'
import { filterLoansByFriend, markReturned, unmarkReturned } from './lib/loanRules.js'
import { createLoan, fetchLoans, updateLoan } from './lib/loansApi.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

function App() {
  // undefined = ยังตรวจสอบ session อยู่, null = ยังไม่ล็อกอิน, object = ล็อกอินแล้ว
  const [session, setSession] = useState(undefined)
  const [loans, setLoans] = useState([])
  const [warning, setWarning] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )

  // ตั้งธีมให้ <html> ก่อนวาดหน้าจอ เพื่อไม่ให้จอกะพริบ
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // ตรวจ session ตอนเปิดหน้า แล้ว subscribe การเปลี่ยนสถานะ (ล็อกอิน, ออกจากระบบ, session หมดอายุ)
  useEffect(() => {
    getSession().then(setSession)
    return onAuthStateChange(setSession)
  }, [])

  // โหลด Loan ของเจ้าของที่ล็อกอินอยู่ทุกครั้งที่ session เปลี่ยน
  useEffect(() => {
    if (!session) return
    fetchLoans().then(({ loans: loaded, warning: loadWarning }) => {
      setLoans(loaded)
      setWarning(loadWarning)
    })
  }, [session])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  if (session === undefined) {
    return <main>กำลังตรวจสอบสถานะเข้าสู่ระบบ...</main>
  }

  if (session === null) {
    return <LoginForm onLogin={login} />
  }

  const today = toIsoDate(new Date())
  const editingLoan = loans.find((loan) => loan.id === editingId) ?? null
  const visibleLoans = filterLoansByFriend(loans, query)

  const handleSave = async (loan) => {
    const { loan: saved, warning: saveWarning } = loan.id
      ? await updateLoan(loan)
      : await createLoan(loan, session.user.id)
    if (saved) {
      setLoans(loan.id ? loans.map((l) => (l.id === saved.id ? saved : l)) : [...loans, saved])
    }
    setWarning(saveWarning)
    setEditingId(null)
  }

  const replaceLoan = async (target, update) => {
    const { loan: saved, warning: saveWarning } = await updateLoan(update(target))
    if (saved) setLoans(loans.map((l) => (l.id === saved.id ? saved : l)))
    setWarning(saveWarning)
  }

  const handleMarkReturned = (loan, returnedDate) =>
    replaceLoan(loan, (l) => markReturned(l, today, returnedDate))

  const handleUnmarkReturned = (loan) => replaceLoan(loan, unmarkReturned)

  return (
    <main>
      <header className="app-header">
        <h1>Borrow Buddy</h1>
        <div className="app-header-actions">
          <span>{session.user.email}</span>
          <button type="button" onClick={() => logout()}>
            ออกจากระบบ
          </button>
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>
      </header>
      {warning && <p role="alert">{warning}</p>}
      <LoanForm
        key={editingLoan?.id ?? 'new'}
        today={today}
        editingLoan={editingLoan}
        onSave={handleSave}
        onCancelEdit={() => setEditingId(null)}
      />
      <SearchBox value={query} onChange={setQuery} />
      <LoanList
        loans={visibleLoans}
        today={today}
        onMarkReturned={handleMarkReturned}
        onUnmarkReturned={handleUnmarkReturned}
        onEdit={(loan) => setEditingId(loan.id)}
      />
    </main>
  )
}

export default App
