import { useState } from 'react';
import PasswordGate from './PasswordGate';
import MainSite from './MainSite';

export default function Index() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <MainSite />;
}
