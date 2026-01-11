import { render, screen } from '@testing-library/react';
import Banner from './Banner';

describe('Banner', () => {
  it('renders the upload controls and guidance text', () => {
    const { container } = render(<Banner dataResponseHandler={() => {}} />);
    const filterInput = container.querySelector('#filterDate');
    const fileInput = container.querySelector('#file');

    expect(
      screen.getByRole('heading', { name: /apple music analyser/i })
    ).toBeInTheDocument();
    expect(filterInput).toHaveAttribute('type', 'date');
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(screen.getByText(/open your .* play activity\.csv/i)).toBeInTheDocument();
  });
});
