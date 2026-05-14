import type { Component } from 'solid-js';

type FooterProps = {
  label: string;
};

const Footer: Component<FooterProps> = (props) => {
  const year = new Date().getFullYear();

  return (
    <footer class="footer-strip">
      <p class="text-center text-xs font-black uppercase tracking-wide text-muted md:text-sm">
        {props.label} / {year}
      </p>
    </footer>
  );
};

export default Footer;
