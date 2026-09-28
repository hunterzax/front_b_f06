// Next.js client boundary. Coverity flags this as unused_expr (NO_EFFECT).
// coverity[unused_expr:SUPPRESS]
'use client';

import { Provider } from 'react-redux';
import store from './store';
// import { store } from './store';

const ProviderRedux = ({ children }: { children: React.ReactNode }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ProviderRedux;