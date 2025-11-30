import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock matchMedia for framer-motion (sometimes needed)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};


// Mock dbService to avoid indexedDB errors
vi.mock('./services/dbService', () => ({
  getUserProgress: vi.fn().mockResolvedValue(null),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.aistudio
    (window as any).aistudio = undefined;
    localStorage.clear();
  });

  it('renders loading spinner initially when checking API key', async () => {
    // Mock aistudio to exist but delay response
    (window as any).aistudio = {
      hasSelectedApiKey: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };

    render(<App />);
    expect(screen.getByText('Checking API key status...')).toBeInTheDocument();
  });

  it('renders CategorySelectionScreen when API key check fails (defaults to true for dev)', async () => {
     // No aistudio
     (window as any).aistudio = undefined;

     render(<App />);

     // It should log a warning and set hasApiKeySelected to true
     await waitFor(() => {
       expect(screen.getByText('Training Modules')).toBeInTheDocument();
     });

     // Check for the Location category which proves the grid is rendered
     // "All Modules" is split by a BR tag which makes it tricky to test with getByText
     expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders CategorySelectionScreen when API key is selected', async () => {
    (window as any).aistudio = {
      hasSelectedApiKey: vi.fn().mockResolvedValue(true),
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Training Modules')).toBeInTheDocument();
    });
  });

  it('renders Access Required when API key is not selected', async () => {
    (window as any).aistudio = {
      hasSelectedApiKey: vi.fn().mockResolvedValue(false),
    };

    render(<App />);

    await waitFor(() => {
        expect(screen.getByText('Access Required')).toBeInTheDocument();
    });
  });
});
