import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
type MountProps = {
  container?: Element;
  store: {
    listen: (
      key: string,
      callback: (data: {
        key: string;
        value: unknown;
        oldValue: unknown;
      }) => void
    ) => void;
    set: (key: string, value: unknown) => void;
    get: <T extends unknown>(key: string) => T;
  };
};
if (!(window as Record<string, any>).PRODUCT_BY_MICRO_FRONTEND) {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}
export function mount(props: MountProps) {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    props.container?.querySelector('#root') || document.getElementById('root')
  );
}
export function unmount(props: MountProps) {
  const { container } = props;
  const element =
    container?.querySelector('#root') || document.querySelector('#root');
  if (element) {
    ReactDOM.unmountComponentAtNode(element);
  }
}
