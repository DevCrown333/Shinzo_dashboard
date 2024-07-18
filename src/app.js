import React, { Suspense } from 'react';
import { createGlobalStyle } from 'styled-components';
import '../public/css/Footer-Dark.css';
import '../public/css/Navigation-Clean.css';
import '../public/css/styles.css';
import '../public/css/origin.css';
import '../public/css/additional.css';
import '../public/bootstrap/css/bootstrap.min.css';
import '../public/fonts/fontawesome-all.min.css';
import '../public/bootstrap/js/bootstrap.min.js';

import { Presale } from './container/presale';
// Import assets
import 'modern-normalize/modern-normalize.css';

// Import Components

// Main page
const App = () => {
  return (
    // <Suspense fallback={<div>Loading...</div>}>
    <Presale />
    // </Suspense>
  );
};

export default App;
