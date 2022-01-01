import { render } from 'react-dom';
import './index.global.scss';
import indexStyles from './index.scss';

render(
  <>
    <p className={`${indexStyles.textRed} mt-10`}>Scan media files:</p>
  </>,
  document.getElementById('root')
);
