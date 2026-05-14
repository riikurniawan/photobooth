import type { Component, JSX } from 'solid-js';

import Footer from './Footer';
import Header from './Header';
import TopNavbar from './TopNavbar';

type LayoutProps = {
  children: JSX.Element;
};

const navItems = ['Home', 'Layouts'];

const Layout: Component<LayoutProps> = (props) => {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-3 px-3 py-4 md:gap-4 md:px-4 md:py-6">
      <TopNavbar items={navItems} />
      <main class="neo-surface flex-1 bg-white p-4 md:p-8">{props.children}</main>
      <Footer label="Photo Booth Studio" />
    </div>
  );
};

export default Layout;
