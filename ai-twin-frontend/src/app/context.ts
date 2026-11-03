import { createContext, useContext } from 'react';
import type { Auth } from '../lib/types';
export type AppContextValue = {
  auth: Auth | null;
  mode: 'light' | 'dark';
  toggleMode: () => void;
  notify: (message: string) => void;
};
export const AppContext = createContext<AppContextValue>({
  auth: null,
  mode: 'light',
  toggleMode: () => {},
  notify: () => {},
});
export const useApp = () => useContext(AppContext);
