/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

describe('App', () => {
  it('renders without crashing', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    await act(async () => {
      root.render(<App />);
    });

    expect(div.querySelector('.App')).toBeTruthy();
    root.unmount();
    div.remove();
  });
});
