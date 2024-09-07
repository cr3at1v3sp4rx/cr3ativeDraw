import React from 'react';
import { createRoot } from 'react-dom/client';
import CollaborativeDrawingBoard from './components/cr3ativeDraw';

const App = () => {
  return (
    <div>
      <CollaborativeDrawingBoard />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;