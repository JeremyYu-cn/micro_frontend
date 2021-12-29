import { useState } from 'react';
// import logo from './logo.svg';
import './App.css';
import { MountProps } from './main';

type AppParam  = {
  props?: MountProps
}

function App({ props }: AppParam) {
  const [data, setData] = useState("")


  return (
    <div className='App'>
      <header className='App-header'>
        <img
          src='http://localhost:3001/src/logo.svg'
          className='App-logo'
          alt='logo'
        />
        <p>Hello Vite + React!</p>
        <p>
          <button type='button' onClick={() => {
            if (!props) return;
            const value = "123";
            props.store.set("aa", value);
            setData(value)
          }}>
            current value is {data}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className='App-link'
            href='https://reactjs.org'
            target='_blank'
            rel='noopener noreferrer'
          >
            Learn React
          </a>
          {' | '}
          <a
            className='App-link'
            href='https://vitejs.dev/guide/features.html'
            target='_blank'
            rel='noopener noreferrer'
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  );
}

export default App;
