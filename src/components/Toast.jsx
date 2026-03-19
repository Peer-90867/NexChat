import { Toaster } from 'react-hot-toast';

export const Toast = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};
