import React, { useState } from 'react';

declare global {
  interface Window {
    electron?: {
      requestListDirectory: () => void;
      onConfirmRequest: (callback: (data: { path: string }) => void) => void;
      sendConfirmResponse: (confirmed: boolean) => void;
      onDirectoryResult: (
        callback: (data: {
          success: boolean;
          files?: string[];
          message?: string;
        }) => void,
      ) => void;
      removeConfirmRequestListener: () => void;
      removeDirectoryResultListener: () => void;
    };
  }
}

export const DirectoryList = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');

  const handleListDirectory = () => {
    if (window.electron?.requestListDirectory) {
      window.electron.requestListDirectory();
    }
  };

  // Set up event listeners
  React.useEffect(() => {
    if (!window.electron) return;

    const onConfirmRequest = (data: { path: string }) => {
      const confirmed = window.confirm(
        `Are you sure you want to list the directory?\n\nPath: ${data.path}`,
      );
      window.electron?.sendConfirmResponse(confirmed);
    };

    const onDirectoryResult = (data: {
      success: boolean;
      files?: string[];
      message?: string;
    }) => {
      if (data.success) {
        setFiles(data.files || []);
        // Clear any previous message when listing is successful
        if (message) {
          setMessage('');
        }
      } else {
        setFiles([]);
        setMessage(data.message || 'An error occurred');
      }
    };

    window.electron.onConfirmRequest(onConfirmRequest);
    window.electron.onDirectoryResult(onDirectoryResult);

    // Return cleanup function
    return () => {
      window.electron?.removeConfirmRequestListener();
      window.electron?.removeDirectoryResultListener();
    };
  }, []);

  if (!window.electron) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleListDirectory}
      >
        List Project Directory
      </button>

      {message && (
        <div
          className={`mt-4 p-4 rounded ${message.includes('cancelled') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
        >
          {message}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-bold">Directory Contents:</h3>
          <ul className="mt-2 border border-gray-600 rounded p-4 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <li
                key={index}
                className="py-1 border-b border-gray-700 last:border-b-0"
              >
                {file}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
