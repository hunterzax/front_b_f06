// Next.js client boundary. Coverity flags this as unused_expr (NO_EFFECT).
// coverity[unused_expr:SUPPRESS]
'use client';

import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '@/utils/store/store';

const ClientOnlyPersistGate = ({ children }:any) => {
  return (
    <PersistGate loading={null} persistor={persistor}>
      {children}
    </PersistGate>
  );
};

export default ClientOnlyPersistGate;