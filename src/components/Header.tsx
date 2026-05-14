import type { Component } from 'solid-js';

type HeaderProps = {
  title: string;
  subtitle: string;
};

const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="bg-brand text-cream p-6 md:p-8">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-wide md:text-4xl">{props.title}</h1>
          <p class="text-sm font-semibold uppercase tracking-wide md:text-base">{props.subtitle}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
