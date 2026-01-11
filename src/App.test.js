import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the banner title on initial load', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /apple music analyser/i })
    ).toBeInTheDocument();
  });
});
