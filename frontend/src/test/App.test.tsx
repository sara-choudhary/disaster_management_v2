import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../pages/LandingPage';
import { Sidebar } from '../components/layout/Sidebar';
import { BrowserRouter } from 'react-router-dom';

describe('LandingPage', () => {
  it('renders complete project title and explore button', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        /Disaster-Resistant Emergency Communication Network with Priority Routing/i
      )
    ).toBeInTheDocument();

    const exploreButton = screen.getByRole('button', { name: /Explore Dashboard/i });
    expect(exploreButton).toBeInTheDocument();
  });

  it('displays accurate team member credits', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Aahaan Kothari — 24BDS0273/i)).toBeInTheDocument();
    expect(screen.getByText(/Sara Choudhary — 24BCT0219/i)).toBeInTheDocument();
    expect(screen.getByText(/Aryan Verma — 24BCT0223/i)).toBeInTheDocument();
  });
});

describe('Sidebar Navigation', () => {
  it('renders all 7 required navigation links when open', () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={handleClose} />
      </BrowserRouter>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Network Topology')).toBeInTheDocument();
    expect(screen.getByText('Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Traffic & QoS')).toBeInTheDocument();
    expect(screen.getByText('Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Alerts & Security')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={handleClose} />
      </BrowserRouter>
    );

    const closeBtn = screen.getByLabelText(/Close sidebar/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
