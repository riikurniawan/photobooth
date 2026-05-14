import type { Component } from 'solid-js';
import Layout from './components/Layout';
import Home from './pages/Home';

const App: Component = () => {
  return (
    <Layout>
      <Home />
    </Layout>
  );
};

export default App;
