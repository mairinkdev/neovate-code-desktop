import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';

// Define the context type
interface TerminalContextType {
  lines: string[];
  activeTab: string;
  inputValue: string;
  executeCommand: (command: string) => Promise<void>;
  setActiveTab: (tab: string) => void;
  setInputValue: (value: string) => void;
}

// Create the context
const TerminalContext = createContext<TerminalContextType | undefined>(
  undefined,
);

// Custom hook to use the context
export function useTerminalContext() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminalContext must be used within Terminal');
  }
  return context;
}

// Main component
export const Terminal = ({
  onExecuteCommand,
}: {
  onExecuteCommand: (command: string) => Promise<void>;
}) => {
  const [lines, setLines] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('terminal-1');
  const [inputValue, setInputValue] = useState('');

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add the command to the terminal output
    setLines((prev) => [...prev, `$ ${command}`]);
    setInputValue('');

    try {
      await onExecuteCommand(command);
      // In a real implementation, we would get the output from the command execution
      // For now, we'll just add a placeholder response
      setLines((prev) => [...prev, `Command executed: ${command}`]);
    } catch (error) {
      setLines((prev) => [...prev, `Error: ${(error as Error).message}`]);
    }
  };

  const contextValue: TerminalContextType = {
    lines,
    activeTab,
    inputValue,
    executeCommand,
    setActiveTab,
    setInputValue,
  };

  return (
    <TerminalContext.Provider value={contextValue}>
      <div className="flex flex-col flex-1 bg-gray-900 text-gray-200 border-t border-gray-700">
        <Terminal.Tabs />
        <Terminal.Output />
        <Terminal.Input />
      </div>
    </TerminalContext.Provider>
  );
};

// Compound components
Terminal.Tabs = function Tabs() {
  const { activeTab, setActiveTab } = useTerminalContext();

  return (
    <div className="flex border-b border-gray-700 bg-gray-850">
      <Terminal.Tab id="terminal-1" isActive={activeTab === 'terminal-1'}>
        Terminal 1
      </Terminal.Tab>
      <Terminal.Tab id="terminal-2" isActive={activeTab === 'terminal-2'}>
        Terminal 2
      </Terminal.Tab>
      <button
        className="px-3 text-gray-400 hover:text-white"
        onClick={() => console.log('Add new terminal')}
      >
        +
      </button>
    </div>
  );
};

Terminal.Tab = function Tab({
  id,
  children,
  isActive,
}: {
  id: string;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  const { setActiveTab } = useTerminalContext();

  return (
    <div
      className={`px-4 py-2 text-sm cursor-pointer ${isActive ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </div>
  );
};

Terminal.Output = function Output() {
  const { lines } = useTerminalContext();
  const outputRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new lines are added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={outputRef}
      className="flex-1 overflow-y-auto font-mono text-sm p-4 whitespace-nowrap"
    >
      {lines.length === 0 ? (
        <div className="text-gray-500">
          Terminal ready. Type a command to begin.
        </div>
      ) : (
        lines.map((line, index) => (
          <div key={index} className="mb-1">
            {line}
          </div>
        ))
      )}
    </div>
  );
};

Terminal.Input = function Input() {
  const { inputValue, setInputValue, executeCommand } = useTerminalContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(inputValue);
  };

  return (
    <div className="border-t border-gray-700 p-2">
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-green-400 mr-2">$</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-transparent text-white focus:outline-none font-mono"
          placeholder="Type a command..."
        />
      </form>
    </div>
  );
};
