import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import './index.global.scss';
import indexStyles from './index.scss';

render(
  <>
    <p className={`${indexStyles.textRed} mt-10`}>Hello World!</p>
    <App />
  </>,
  document.getElementById('root')
);
