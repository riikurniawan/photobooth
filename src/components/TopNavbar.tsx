import { For, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

type TopNavbarProps = {
  items: string[];
};

const TopNavbar: Component<TopNavbarProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <nav aria-label="Primary navigation" class="topnav-wrap">
      <div class="flex items-center justify-between gap-4 py-2">
        <a href="#" class="topnav-brand">
          photo.booth
        </a>
        <button
          type="button"
          class="hamburger-btn md:hidden"
          aria-expanded={isOpen()}
          aria-controls="primary-nav-list"
          onClick={() => setIsOpen(!isOpen())}
        >
          {isOpen() ? '✕' : '☰'}
        </button>
        <ul
          id="primary-nav-list"
          class={`${isOpen() ? 'flex' : 'hidden'} topnav-mobile-menu md:flex md:items-center md:gap-7`}
        >
          <For each={props.items}>
            {(item) => (
              <li>
                <a href="#" class="topnav-link" onClick={() => setIsOpen(false)}>
                  {item}
                </a>
              </li>
            )}
          </For>
        </ul>
      </div>
    </nav>
  );
};

export default TopNavbar;
