import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import UnsafeScriptsWarning from './components/UnsafeScriptsWarning';
import './market-data/init'; // Initialize providers at module load time

function App() {
  const [showSpinner, setShowSpinner] = useState(true);

  const hideSpinner = () => {
    setShowSpinner(false);
  };

  return (
    <ErrorBoundary fallback={<UnsafeScriptsWarning />}>
      <div className="min-h-screen bg-[radial-gradient(rgb(1,8,53),rgb(5,32,12))] text-foreground">
        <Dashboard hideSpinner={hideSpinner} showSpinner={showSpinner} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
